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
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ----------------------
// Load environment variables từ file .env
// ----------------------
Env.Load();

string GetEnvOrThrow(string key) =>
    Environment.GetEnvironmentVariable(key) ?? throw new Exception($"{key} is not set in .env file!");

// Database
var dbPassword = GetEnvOrThrow("DB_PASSWORD");

// Cloudinary
var cloudName = GetEnvOrThrow("CLOUDINARY_CLOUD_NAME");
var cloudApiKey = GetEnvOrThrow("CLOUDINARY_API_KEY");
var cloudApiSecret = GetEnvOrThrow("CLOUDINARY_API_SECRET");
var cloudinary = new Cloudinary(new Account(cloudName, cloudApiKey, cloudApiSecret))
{
    Api = { Secure = true }
};
builder.Services.AddSingleton(cloudinary);

// OpenAI
var openAiApiKey = GetEnvOrThrow("OPENAI_API_KEY");

// JWT
var jwtKey = GetEnvOrThrow("JWT_KEY");
var jwtIssuer = GetEnvOrThrow("JWT_ISSUER");
var jwtAudience = GetEnvOrThrow("JWT_AUDIENCE");
var jwtExpireMinutes = int.Parse(Environment.GetEnvironmentVariable("JWT_EXPIRE_MINUTES") ?? "15");
var jwtRefreshTokenExpireDays = int.Parse(Environment.GetEnvironmentVariable("JWT_REFRESH_TOKEN_EXPIRE_DAYS") ?? "7");

// Email
var emailHost = GetEnvOrThrow("EMAIL_HOST");
var emailPort = int.Parse(Environment.GetEnvironmentVariable("EMAIL_PORT") ?? "587");
var emailUsername = GetEnvOrThrow("EMAIL_USERNAME");
var emailPassword = GetEnvOrThrow("EMAIL_PASSWORD");

// ----------------------
// DbContext
// ----------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                     ?.Replace("{DB_PASSWORD}", dbPassword);
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// ----------------------
// AutoMapper
// ----------------------
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// ----------------------
// Repositories
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
builder.Services.AddScoped<IUserOtpRepositories, UserOtpRepositoriesImpl>();
builder.Services.AddScoped<ICartItemRepositories, CartItemRepositoriesImpl>();
builder.Services.AddScoped<ICartRepositories, CartRepositoriesImpl>();
builder.Services.AddScoped<IWishListItemRepositories, WishListItemRepositoriesImpl>();
builder.Services.AddScoped<IProductCollectionRepositories, ProductCollectionRepositoriesImpl>();
builder.Services.AddScoped<IVoucherRepositories, VoucherRipositoriesImpl>();
builder.Services.AddScoped<IOrderDetailRepositories, OrderDetailRepositoriesImpl>();
builder.Services.AddScoped<IShipmentRepositories, ShipmentRepositoriesImpl>();

// ----------------------
// Services
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
builder.Services.AddScoped<IEmailService,EmailServiceImpl>();
builder.Services.AddScoped<ICartService,CartServiceImpl>();
builder.Services.AddScoped<IWishListItemService,WishListItemServiceImpl>();
builder.Services.AddScoped<IVoucherService,VoucherServiceImpl>();


// ----------------------
// Đăng ký AutoMapper (quét toàn bộ assemblies để tìm Profile)
// ----------------------
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddScoped<IEmailService, EmailServiceImpl>();
builder.Services.AddScoped<IProductCollectionServices, ProductCollectionServicesImpl>();

// IEmbeddingService (inject OpenAI API Key)
builder.Services.AddScoped<IEmbeddingService>(sp =>
{
    var mapper = sp.GetRequiredService<IMapper>();
    var unitOfWork = sp.GetRequiredService<IUnitOfWork>();
    return new EmbeddingServiceImpl(mapper, unitOfWork, openAiApiKey);
});

// ----------------------
// Controllers
// ----------------------
builder.Services.AddControllers();

// ----------------------
// Swagger + JWT Auth
// ----------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Backend_SEP490", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header
            },
            new List<string>()
        }
    });
});

// ----------------------
// JWT Authentication
// ----------------------
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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

// ----------------------
// Config Cors
// ----------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://192.168.1.183:3000/", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});


builder.Services.AddAuthorization();

// ----------------------
// Build & run app
// ----------------------
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
