using System;
using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Backend_SEP490.Models;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    
    public AppDbContext CreateDbContext(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var envFilePath = Path.Combine(builder.Environment.ContentRootPath, ".env");
        if (File.Exists(envFilePath))
        {
            Env.Load(envFilePath);
        }

        string GetEnvOrThrow(string key) =>
            Environment.GetEnvironmentVariable(key) ??
            throw new Exception("{key} is not configured. Please set it via environment variables hoặc file .env.");

        string? GetEnvOrNull(string key) => Environment.GetEnvironmentVariable(key);

        int GetEnvInt(string key, int defaultValue = 0)
        {
            var rawValue = Environment.GetEnvironmentVariable(key);
            return int.TryParse(rawValue, out var parsed) ? parsed : defaultValue;
        }
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        var connectionString = GetEnvOrNull("ConnectionStrings__DefaultConnection")
                               ?? builder.Configuration.GetConnectionString("DefaultConnection");

        var dbPassword = GetEnvOrNull("DB_PASSWORD");
        if (!string.IsNullOrWhiteSpace(connectionString) &&
            connectionString.Contains("{DB_PASSWORD}", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(dbPassword))
            {
                throw new Exception("DB_PASSWORD is required when connection string contains {DB_PASSWORD}");
            }
            connectionString = connectionString.Replace("{DB_PASSWORD}", dbPassword);
        }

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new Exception("ConnectionStrings:DefaultConnection is not configured.");
        }

        optionsBuilder.UseNpgsql(connectionString);
        return new AppDbContext(optionsBuilder.Options);
    }
}
