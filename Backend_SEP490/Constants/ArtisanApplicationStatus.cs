namespace Backend_SEP490.Constants;

public static class ArtisanApplicationStatus
{
    public const string Pending = "PENDING";
    public const string Done = "DONE";
    public const string Rejected = "REJECTED";

    public static bool IsFinal(string status) =>
        string.Equals(status, Done, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(status, Rejected, StringComparison.OrdinalIgnoreCase);
}
