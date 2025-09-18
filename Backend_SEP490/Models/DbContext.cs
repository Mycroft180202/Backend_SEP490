using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Models
{

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options):base(options){}
        public DbSet<Product> Products { get; set; }
    }
}