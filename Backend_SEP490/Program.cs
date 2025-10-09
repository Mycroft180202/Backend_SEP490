using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Repositories.impl;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using Backend_SEP490.Mapper;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using System.Reflection;
using DotNetEnv;
var builder = WebApplication.CreateBuilder(args);
Env.Load();
// Add services to the container.
builder.Services.AddControllers();

// Kết nối PostgreSQL qua EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Đăng ký Repository & Service
//repository
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddScoped<IProductRepositories, ProductRepositoriesImpl>();
//sercive
builder.Services.AddScoped<IProductServices, ProductServicesImpl>();

// Đăng ký AutoMapper (quét toàn bộ assemblies để tìm Profile)
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
