using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class UserRole
{
    [Key]
    public string Id { get; set; }
    public string UserID { get; set; }
    public string RoleID { get; set; }

    public User User { get; set; }
    public Role Role { get; set; }
}
