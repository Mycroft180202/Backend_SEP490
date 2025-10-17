using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Repositories.impl;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using Backend_SEP490.Mapper;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using CloudinaryDotNet;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ----------------------
// Load environment variables từ file .env
// ----------------------
Env.Load();
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");
var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");
var cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret))
{
    Api = { Secure = true }
};
builder.Services.AddSingleton(cloudinary);
if (string.IsNullOrEmpty(dbPassword))
{
    throw new Exception("DB_PASSWORD is not set in .env file!");
}

// ----------------------
// Cấu hình DbContext với PostgreSQL
// ----------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                     ?.Replace("{DB_PASSWORD}", dbPassword);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ----------------------
// Đăng ký Controllers
// ----------------------
builder.Services.AddControllers();

// ----------------------
// Cấu hình Swagger
// ----------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ----------------------
// Đăng ký Repository
// ----------------------
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IProductRepositories, ProductRepositoriesImpl>();
builder.Services.AddScoped<IUserRepositories, UserRepositoriesImpl>();
builder.Services.AddScoped<IFeedbackRepositories, FeedbackRepositoriesImpl>();
builder.Services.AddScoped<IProductImagesRepositories, ProductImagesRepositoriesImpl>();
builder.Services.AddScoped<IOrderRepositories, OrderRepositoriesImpl>();
builder.Services.AddScoped<IBlogRepositories, BlogRepositoriesImpl>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepositoryImpl>();
builder.Services.AddScoped<ICategoryRepositories, CategoryRepositoriesImpl>();
builder.Services.AddScoped<IRoleRepository, RoleRepositoryImpl>();
builder.Services.AddScoped<IUserRoleRepository, UserRoleRepositoryImpl>();
builder.Services.AddScoped<IAddressRepositories, AddressRepositoriesImpl>();
// ----------------------
// Đăng ký Service
// ----------------------
builder.Services.AddScoped<IProductServices, ProductServicesImpl>();
builder.Services.AddScoped<IUserServices, UserServicesImpl>();
builder.Services.AddScoped<IFeedbackServices, FeedbackServicesImpl>();
builder.Services.AddScoped<IProductImagesServices, ProductImagesServicesImpl>();
builder.Services.AddScoped<IOrderService, OrderServiceImpl>();
builder.Services.AddScoped<IBlogPostService, BlogPostServiceImpl>();
builder.Services.AddScoped<ICategoryServices, CategoryServicesImpl>();
builder.Services.AddScoped<ICategoryServices, CategoryServicesImpl>();
builder.Services.AddScoped<IAddressService, AddressServiceImpl>();
// ----------------------
// Đăng ký AutoMapper (quét toàn bộ assemblies để tìm Profile)
// ----------------------
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// ----------------------
// Cấu hình JWT
// ----------------------
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") 
             ?? builder.Configuration["Jwt:Key"];
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") 
                ?? builder.Configuration["Jwt:Issuer"];
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
                  ?? builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// ----------------------
// Configure HTTP request pipeline
// ----------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ⚡ Quan trọng: thêm UseAuthentication trước UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
