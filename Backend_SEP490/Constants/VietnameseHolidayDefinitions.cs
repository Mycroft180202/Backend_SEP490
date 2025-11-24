using System.Globalization;

namespace Backend_SEP490.Constants;

public record FestivalVoucherDefinition(
    string Code,
    string Name,
    decimal DiscountPercent,
    int UsageLimit,
    Func<int, (DateTime StartUtc, DateTime EndUtc)> RangeResolver);

public static class VietnameseHolidayDefinitions
{
    private static readonly ChineseLunisolarCalendar LunarCalendar = new();
    public static IReadOnlyList<FestivalVoucherDefinition> Festivals { get; } = new List<FestivalVoucherDefinition>
    {
        new("TET_DUONG", "Tet Duong lich", 12m, 300, year => FixedRange(year, 1, 1, 1)),
        new("TET_NGUYEN_DAN", "Tet Nguyen dan", 18m, 500, ResolveTetNguyenDan),
        new("HUNG_VUONG", "Gio to Hung Vuong", 10m, 250, ResolveHungVuong),
        new("REUNIFICATION", "30/4 Giai phong", 15m, 300, year => FixedRange(year, 4, 30, 1)),
        new("LABOR_DAY", "Quoc te Lao dong 1/5", 10m, 300, year => FixedRange(year, 5, 1, 1)),
        new("INDEPENDENCE", "Quoc khanh 2/9", 15m, 400, year => FixedRange(year, 9, 2, 2))
    };

    private static (DateTime StartUtc, DateTime EndUtc) FixedRange(int year, int month, int day, int durationDays)
    {
        var start = DateTime.SpecifyKind(new DateTime(year, month, day, 0, 0, 0), DateTimeKind.Utc);
        var end = start.AddDays(durationDays).AddSeconds(-1);
        return (start, end);
    }

    private static (DateTime StartUtc, DateTime EndUtc) ResolveTetNguyenDan(int year)
    {
        var start = ConvertLunarDate(year - 1, 12, 27);
        var end = ConvertLunarDate(year, 1, 5).AddDays(1).AddSeconds(-1);
        return (start, end);
    }

    private static (DateTime StartUtc, DateTime EndUtc) ResolveHungVuong(int year)
    {
        var start = ConvertLunarDate(year, 3, 10);
        var end = start.AddDays(1).AddSeconds(-1);
        return (start, end);
    }

    private static DateTime ConvertLunarDate(int lunarYear, int lunarMonth, int lunarDay)
    {
        try
        {
            var date = LunarCalendar.ToDateTime(lunarYear, lunarMonth, lunarDay, 0, 0, 0, 0);
            return DateTime.SpecifyKind(date, DateTimeKind.Utc);
        }
        catch (ArgumentOutOfRangeException)
        {
            // Fallback to an approximated solar date in case the lunisolar conversion fails.
            var fallbackYear = Math.Max(lunarYear, 1901);
            var fallbackMonth = Math.Clamp(lunarMonth, 1, 12);
            var fallbackDay = Math.Clamp(lunarDay, 1, DateTime.DaysInMonth(fallbackYear, fallbackMonth));
            return DateTime.SpecifyKind(new DateTime(fallbackYear, fallbackMonth, fallbackDay, 0, 0, 0), DateTimeKind.Utc);
        }
    }
}
