using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class Role
{
    [Key]
    public string Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    [JsonIgnore]
    public ICollection<UserRole>? UserRoles { get; set; }
}
