using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class Product
{
    [Key]
    public string Id { get; set; }
    public string Name { get; set; }
    public string? ShortDescription { get; set; }
    public string? LongDescription { get; set; }
    public decimal Price { get; set; }
    public string Category { get; set; }
    public bool IsActive { get; set; }
    public string ArtisanId { get; set; }
    public DateTime? CreateAt { get; set; }
    public DateTime? UpdateAt { get; set; }
    public int Stock { get; set; }

    public Category CategoryNav { get; set; }
    public User Artisan { get; set; }

    public ICollection<ProductImage>? ProductImages { get; set; }
    public ICollection<CartItem>? CartItems { get; set; }
    public ICollection<OrderItem>? OrderItems { get; set; }
    public ICollection<Feedback>? Feedbacks { get; set; }
    public ICollection<PromotionProduct>? PromotionProducts { get; set; }
    public ICollection<WishListItem>? WishListItems { get; set; }
}

