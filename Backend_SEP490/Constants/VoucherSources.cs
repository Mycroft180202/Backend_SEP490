namespace Backend_SEP490.Constants;

public static class VoucherSources
{
    public const string Refund = "REFUND";
    public const string LargeOrder = "LARGE";
    public const string Festival = "FESTIVAL";
    public const string Loyalty = "LOYALTY";

    public static string ForRefund(string orderNumber) => $"{Refund}:{orderNumber}";
    public static string ForLargeOrder(string orderNumber) => $"{LargeOrder}:{orderNumber}";
    public static string ForFestival(string festivalCode, int year) => $"{Festival}:{festivalCode}:{year}";
    public static string FestivalPrefix(string festivalCode) => $"{Festival}:{festivalCode}:";
    public static string ForLoyalty(string userId, int year) => $"{Loyalty}:{year}:{userId}";
    public static string LoyaltyPrefix(int year) => $"{Loyalty}:{year}:";
}
