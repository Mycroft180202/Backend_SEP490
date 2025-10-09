namespace Backend_SEP490.Models;

public class AuditLog
{
    public string LogID { get; set; }
    public string ActionType { get; set; }
    public string EntityName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; }
}
