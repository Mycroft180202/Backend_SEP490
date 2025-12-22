using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class Notification
{
    [Key]
    public string Id { get; set; }
    public string UserID { get; set; }
    public string Message { get; set; }
    public string Type { get; set; }
    public bool IsRead { get; set; }
    public DateTime? CreateAt { get; set; }
    [JsonIgnore]
    public User User { get; set; }
}
