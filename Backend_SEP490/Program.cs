using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Repositories.impl;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using Backend_SEP490.Mapper;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);

// ----------------------
// Load environment variables từ file .env
// ----------------------
Env.Load();
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");
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

// ----------------------
// Đăng ký Service
// ----------------------
builder.Services.AddScoped<IProductServices, ProductServicesImpl>();
builder.Services.AddScoped<IUserServices, UserServicesImpl>();
builder.Services.AddScoped<IFeedbackServices, FeedbackServicesImpl>();
builder.Services.AddScoped<IProductImagesServices, ProductImagesServicesImpl>();

// ----------------------
// Đăng ký AutoMapper (quét toàn bộ assemblies để tìm Profile)
// ----------------------
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

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
app.UseAuthorization();
app.MapControllers();

app.Run();
