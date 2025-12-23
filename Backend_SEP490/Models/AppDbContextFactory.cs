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

        var connStr =
        $@"Host={Environment.GetEnvironmentVariable("DB_HOST")};
   Port={Environment.GetEnvironmentVariable("DB_PORT")};
   Database={Environment.GetEnvironmentVariable("DB_NAME")};
   Username={Environment.GetEnvironmentVariable("DB_USER")};
   Password={Environment.GetEnvironmentVariable("DB_PASSWORD")};
   SSL Mode=Require;
   Trust Server Certificate=true;";

        optionsBuilder.UseNpgsql(connStr);
        return new AppDbContext(optionsBuilder.Options);
    }
}
