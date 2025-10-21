using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_SEP490.Models
{
    public class ProductCollection
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProductCollectionId { get; set; }

        [Required, MaxLength(255)]
        public string Title { get; set; }

        [MaxLength(500)]
        public string? Headline { get; set; }

        public string? Content { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }

        public string? CreatedById { get; set; }
        public string? UpdatedById { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation
        [ForeignKey(nameof(CreatedById))]
        public User? CreatedBy { get; set; }

        [ForeignKey(nameof(UpdatedById))]
        public User? UpdatedBy { get; set; }

        // Quan hệ 1-N: Một collection có nhiều product
        public ICollection<Product> ProductCollectionItems { get; set; } = new List<Product>();
    }
}