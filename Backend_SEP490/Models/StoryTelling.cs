using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class StoryTelling
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public string ProductId { get; set; }

    [Required]
    public StoryTellingType StoryType { get; set; }

    [Required, MaxLength(255)]
    public string Title { get; set; }

    [Required]
    public string Content { get; set; }

    [Required, MaxLength(2048)]
    public string Image { get; set; }

    [Required]
    public string CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]
    public Product Product { get; set; }
    [JsonIgnore]
    public User CreatedBy { get; set; }
}

public enum StoryTellingType
{
    ProductStory = 0,
    CraftingProcess = 1,
    ArtisanBiography = 2
}
