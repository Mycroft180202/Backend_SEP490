using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class UserRole
{
    [Key]
    public string Id { get; set; }
    public string UserID { get; set; }
    public string RoleID { get; set; }
    [JsonIgnore]
    public User User { get; set; }
    public Role Role { get; set; }
}
