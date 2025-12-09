using System.Linq;
using System.Text.Json;
using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Services;
using Microsoft.EntityFrameworkCore;
using RequestDTOProduct = Backend_SEP490.DTOs.Response.RequestDTOProduct;

namespace Backend_SEP490.SystemTests.Infrastructure;

internal sealed class TestProductServices : IProductServices
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;

    public TestProductServices(AppDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    public async Task<bool> CreateProductAsync(RequestDTOProduct productDto)
    {
        var product = new Product
        {
            Id = $"PROD-{Guid.NewGuid():N}",
            Name = productDto.Name,
            ShortDescription = productDto.ShortDescription,
            LongDescription = productDto.LongDescription,
            Price = productDto.Price,
            Category = productDto.Category,
            ArtisanId = productDto.ArtisanId,
            Stock = productDto.Stock,
            QuantitySale = 0,
            IsActive = true,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            EmbeddingJson = JsonDocument.Parse("[]")
        };

        _dbContext.Products.Add(product);

        if (productDto.Images != null && productDto.Images.Count > 0)
        {
            var position = 0;
            foreach (var formFile in productDto.Images)
            {
                var image = new ProductImage
                {
                    Id = $"PIMG-{Guid.NewGuid():N}",
                    ProductId = product.Id,
                    URL = $"https://system-tests.local/{Guid.NewGuid():N}.png",
                    Position = position++
                };
                _dbContext.ProductImages.Add(image);
            }
        }

        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateProductAsync(string id, RequestDTOProduct productDto)
    {
        var product = await _dbContext.Products.Include(p => p.ProductImages).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
        {
            return false;
        }

        product.Name = productDto.Name;
        product.ShortDescription = productDto.ShortDescription;
        product.LongDescription = productDto.LongDescription;
        product.Price = productDto.Price;
        product.Category = productDto.Category;
        product.Stock = productDto.Stock;
        product.UpdateAt = DateTime.UtcNow;

        if (product.ProductImages != null)
        {
            _dbContext.ProductImages.RemoveRange(product.ProductImages);
        }

        if (productDto.Images != null && productDto.Images.Count > 0)
        {
            var position = 0;
            foreach (var file in productDto.Images)
            {
                _dbContext.ProductImages.Add(new ProductImage
                {
                    Id = $"PIMG-{Guid.NewGuid():N}",
                    ProductId = product.Id,
                    URL = $"https://system-tests.local/{Guid.NewGuid():N}.png",
                    Position = position++
                });
            }
        }

        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteProductAsync(string productId)
    {
        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == productId);
        if (product == null)
        {
            return false;
        }

        product.IsActive = false;
        product.UpdateAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<ResponseDTOProductDetail> GetProductByIdAsync(string id)
    {
        var product = await _dbContext.Products
            .Include(p => p.ProductImages)
            .FirstOrDefaultAsync(p => p.Id == id);
        return _mapper.Map<ResponseDTOProductDetail>(product)!;
    }

    public async Task<PagedResult<ResponseDTOProduct>> GetProductsAsync(string? productName, string? categoryId, bool? isactive, int pageIndex, int pageSize, string? sortBy = null)
    {
        var query = _dbContext.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(productName))
        {
            query = query.Where(p => p.Name.ToLower().Contains(productName.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(categoryId))
        {
            query = query.Where(p => p.Category == categoryId);
        }

        if (isactive.HasValue)
        {
            query = query.Where(p => p.IsActive == isactive.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(p => p.Name)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var mapped = _mapper.Map<List<ResponseDTOProduct>>(items);
        return new PagedResult<ResponseDTOProduct>
        {
            Items = mapped,
            TotalCount = total,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    public async Task<bool> UpdateProductIsActiveStatusAsync(string productId, bool isActive)
    {
        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == productId);
        if (product == null)
        {
            return false;
        }

        product.IsActive = isActive;
        product.UpdateAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetAvailableProductsAsync()
        => Task.FromResult<IEnumerable<DTOs.Request.ResponseDTOProduct>>(Array.Empty<DTOs.Request.ResponseDTOProduct>());

    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetUnavailableProductsAsync()
        => Task.FromResult<IEnumerable<DTOs.Request.ResponseDTOProduct>>(Array.Empty<DTOs.Request.ResponseDTOProduct>());

    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetAllProductsAsync()
        => Task.FromResult<IEnumerable<DTOs.Request.ResponseDTOProduct>>(Array.Empty<DTOs.Request.ResponseDTOProduct>());

    public Task<PagedResult<ResponseDTOProductDashboard>> GetProductsDashboardByUserIdAsync(string? userId, int pageIndex, int pageSize)
        => throw new NotSupportedException();

    public Task<IEnumerable<ResponseDTOProductDashboard>> GetTopProductsByRevenueAsync(string? userId, int? year, int? month)
        => throw new NotSupportedException();

    public Task<IEnumerable<ResponseDTOProductDashboard>> GetTopProductsByTotalSoldAsync(string? userId, int? year, int? month)
        => throw new NotSupportedException();

    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByArtisanIdAsync(string artisanId)
        => throw new NotSupportedException();

    public Task<ResponseDTOOutOfStockProductNumber> GetProductsOutOfStockNumberByArtisanIdAsync(string artisanId)
        => throw new NotSupportedException();

    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByCategoryAsync(string categoryId)
        => throw new NotSupportedException();

    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByNameAsync(string productName)
        => throw new NotSupportedException();
}
