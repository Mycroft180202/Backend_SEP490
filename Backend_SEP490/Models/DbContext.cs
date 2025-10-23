using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Models
{

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options):base(options){}
        // DbSet cho từng bảng
        public DbSet<User> Users { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<BlogPost> BlogPosts { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<ProductCollection> ProductCollections { get; set; }
        public DbSet<Voucher> Vouchers { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Shipment> Shipments { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<WishListItem> WishListItems { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<UserOtp> UserOtps { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ========== USER ==========
            modelBuilder.Entity<User>()
                .HasKey(u => u.UserID);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Addresses)
                .WithOne(a => a.User)
                .HasForeignKey(a => a.UserID)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<User>()
                .HasMany(u => u.RefreshTokens)
                .WithOne(rt => rt.User)
                .HasForeignKey(rt => rt.UserId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.BlogPosts)
                .WithOne(b => b.Author)
                .HasForeignKey(b => b.AuthorId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Carts)
                .WithOne(c => c.Customer)
                .HasForeignKey(c => c.CustomerID);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Feedbacks)
                .WithOne(f => f.Customer)
                .HasForeignKey(f => f.CustomerId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Notifications)
                .WithOne(n => n.User)
                .HasForeignKey(n => n.UserID);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Orders)
                .WithOne(o => o.Customer)
                .HasForeignKey(o => o.CustomerId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Products)
                .WithOne(p => p.Artisan)
                .HasForeignKey(p => p.ArtisanId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Reports)
                .WithOne(r => r.Reporter)
                .HasForeignKey(r => r.ReporterId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.UserRoles)
                .WithOne(ur => ur.User)
                .HasForeignKey(ur => ur.UserID);

            modelBuilder.Entity<User>()
                .HasMany(u => u.WishListItems)
                .WithOne(w => w.User)
                .HasForeignKey(w => w.UserID);

            // ========== CART ==========
            modelBuilder.Entity<Cart>()
                .HasMany(c => c.CartItems)
                .WithOne(ci => ci.Cart)
                .HasForeignKey(ci => ci.CartId);

            // ========== PRODUCT ==========
            modelBuilder.Entity<Product>()
                .HasOne(p => p.CategoryNav)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.Category);
            modelBuilder.Entity<Product>()
                .Property(p => p.EmbeddingJson)
                .HasColumnType("jsonb");
            modelBuilder.Entity<Product>()
                .HasMany(p => p.ProductImages)
                .WithOne(pi => pi.Product)
                .HasForeignKey(pi => pi.ProductId);

            modelBuilder.Entity<Product>()
                .HasMany(p => p.CartItems)
                .WithOne(ci => ci.Product)
                .HasForeignKey(ci => ci.ProductId);

            modelBuilder.Entity<Product>()
                .HasMany(p => p.OrderItems)
                .WithOne(oi => oi.Product)
                .HasForeignKey(oi => oi.ProductID);

            modelBuilder.Entity<Product>()
                .HasMany(p => p.Feedbacks)
                .WithOne(f => f.Product)
                .HasForeignKey(f => f.ProductId);

            
            modelBuilder.Entity<Product>()
                .HasMany(p => p.WishListItems)
                .WithOne(w => w.Product)
                .HasForeignKey(w => w.ProductID);

            // ========== ORDER ==========
            modelBuilder.Entity<Order>()
                .HasMany(o => o.OrderItems)
                .WithOne(oi => oi.Order)
                .HasForeignKey(oi => oi.OrderID);

            modelBuilder.Entity<Order>()
                .HasMany(o => o.Payments)
                .WithOne(p => p.Order)
                .HasForeignKey(p => p.OrderID);

            modelBuilder.Entity<Order>()
                .HasMany(o => o.Shipments)
                .WithOne(s => s.Order)
                .HasForeignKey(s => s.OrderID);

            // ========== ROLE ==========
            modelBuilder.Entity<Role>()
                .HasMany(r => r.UserRoles)
                .WithOne(ur => ur.Role)
                .HasForeignKey(ur => ur.RoleID);

            // ========== PRODUCT COLLECTION ==========
            modelBuilder.Entity<ProductCollection>(entity =>
            {
                entity.Property(pc => pc.CreatedDate)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(pc => pc.IsActive)
                    .HasDefaultValue(true);

                entity.HasOne(pc => pc.CreatedBy)
                    .WithMany()
                    .HasForeignKey(pc => pc.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(pc => pc.UpdatedBy)
                    .WithMany()
                    .HasForeignKey(pc => pc.UpdatedById)
                    .OnDelete(DeleteBehavior.Restrict);
            });
// ========== VOUCHER ==========
            modelBuilder.Entity<Voucher>(entity =>
            {
                entity.Property(v => v.CreatedDate)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(v => v.IsActive)
                    .HasDefaultValue(true);

                entity.HasOne(v => v.CreatedBy)
                    .WithMany()
                    .HasForeignKey(v => v.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            // ========== PRODUCT <-> PRODUCT COLLECTION (N-N) ==========
            modelBuilder.Entity<Product>()
                .HasMany(p => p.ProductCollections)
                .WithMany(pc => pc.ProductCollectionItems)
                .UsingEntity<Dictionary<string, object>>(
                    "ProductCollectionProduct",
                    j => j
                        .HasOne<ProductCollection>()
                        .WithMany()
                        .HasForeignKey("ProductCollectionId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j => j
                        .HasOne<Product>()
                        .WithMany()
                        .HasForeignKey("ProductId")
                        .OnDelete(DeleteBehavior.Cascade)
                );
            
        }
    }
    
}