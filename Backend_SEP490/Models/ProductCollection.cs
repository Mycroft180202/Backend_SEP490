using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;

public class ProductCollection
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductCollectionId { get; set; }

    [Required, MaxLength(255)]
    public string Title { get; set; }

    public string Image { get; set; }

    [MaxLength(500)]
    public string? Headline { get; set; }
    public string? Content { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public DateTime CreatedDate { get; set; }

    public DateTime? UpdatedDate { get; set; }

    public string? CreatedById { get; set; }
    public string? UpdatedById { get; set; }
    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(CreatedById))]
    public User? CreatedBy { get; set; }

    [ForeignKey(nameof(UpdatedById))]
    public User? UpdatedBy { get; set; }
    
    [JsonIgnore]
    public ICollection<Product> ProductCollectionItems { get; set; } = new List<Product>();
}