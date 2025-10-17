using System.ComponentModel.DataAnnotations;
using Backend_SEP490.Models;
using Newtonsoft.Json;

public class User
{
    [Key]
    public string UserID { get; set; }
    public string Username { get; set; }
    public string PasswordHash { get; set; }
    public string Email { get; set; }
    public bool IsActive { get; set; }
    public DateTime? UpdateAt { get; set; }
    public DateTime? CreateAt { get; set; }
    public string? PhoneNumber { get; set; }
    public string? DisplayName { get; set; }
    public DateTime? Dob { get; set; }
    public string? ShopName { get; set; }
    public string? Bio { get; set; }
    public int? Rating { get; set; }
    public int? AdminLevel { get; set; }

    // 👇 Thêm 2 cột mới
    public string? UserUrlImage { get; set; }
    public string? ShopUrlImage { get; set; }

    [JsonIgnore]
    // Navigation
    public ICollection<RefreshToken> RefreshTokens { get; set; }
    public ICollection<Address>? Addresses { get; set; }
    public ICollection<BlogPost>? BlogPosts { get; set; }
    public ICollection<Cart>? Carts { get; set; }
    public ICollection<Feedback>? Feedbacks { get; set; }
    public ICollection<Notification>? Notifications { get; set; }
    public ICollection<Order>? Orders { get; set; }
    public ICollection<Product>? Products { get; set; }
    public ICollection<PromotionCampaign>? PromotionCampaigns { get; set; }
    public ICollection<Report>? Reports { get; set; }
    public ICollection<UserRole>? UserRoles { get; set; }
    public ICollection<WishListItem>? WishListItems { get; set; }
}