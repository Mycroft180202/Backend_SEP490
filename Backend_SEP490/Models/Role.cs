using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class Role
{
    [Key]
    public string Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }

    public ICollection<UserRole>? UserRoles { get; set; }
}
