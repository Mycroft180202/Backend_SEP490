using System.Text.Json;
using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Newtonsoft.Json;
using JsonSerializer = System.Text.Json.JsonSerializer;
using RequestDTOProduct = Backend_SEP490.DTOs.Response.RequestDTOProduct;

namespace Backend_SEP490.Services.impl;

public class ProductServicesImpl: GenericServices, IProductServices
{
    private readonly IUserServices _userServices;
    private readonly IFeedbackServices _feedbackServices;
    private readonly IProductImagesServices _productImagesServices;
    private readonly Cloudinary _cloudinary;
    private readonly IEmbeddingService _embeddingService;
    public ProductServicesImpl(IMapper mapper, IUnitOfWork unitOfWork,IEmbeddingService embeddingService,IUserServices userServices,IFeedbackServices feedbackServices,IProductImagesServices productImagesServices , Cloudinary cloudinary) : base(mapper, unitOfWork)
    {
        _userServices= userServices;
        _feedbackServices = feedbackServices;
        _productImagesServices = productImagesServices;
        _cloudinary = cloudinary;
        _embeddingService = embeddingService;
    }

    private async Task<List<DTOs.Request.ResponseDTOProduct>> MapAndEnrichProductsAsync(IEnumerable<Product> products)
    {
        var sourceProducts = products?.ToList() ?? new List<Product>();
        var mapped = _mapper.Map<List<DTOs.Request.ResponseDTOProduct>>(sourceProducts);

        if (mapped.Count == 0)
        {
            return mapped;
        }

        var artisanIds = mapped
            .Select(p => p.ArtisanId)
            .Where(id => !string.IsNullOrEmpty(id))
            .Distinct()
            .ToList();

        var productIds = mapped
            .Select(p => p.Id)
            .Where(id => !string.IsNullOrEmpty(id))
            .Distinct()
            .ToList();

        var users = artisanIds.Count > 0
            ? await _context.Users.GetUsersByIdsAsync(artisanIds)
            : new List<User>();

        var feedbacks = productIds.Count > 0
            ? await _context.Feedback.GetFeedbacksByProductIdsAsync(productIds)
            : new List<Feedback>();

        var images = productIds.Count > 0
            ? await _context.ProductImages.GetImagesByProductIdsAsync(productIds)
            : new List<ProductImage>();

        var userDict = users.ToDictionary(u => u.UserID);

        var ratingDict = feedbacks
            .GroupBy(f => f.ProductId)
            .ToDictionary(
                g => g.Key,
                g => g.Average(x => x.Rating)
            );

        var imageDict = images
            .GroupBy(i => i.ProductId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderBy(i => i.Position).FirstOrDefault()
            );

        foreach (var pro in mapped)
        {
            if (!string.IsNullOrEmpty(pro.ArtisanId)
                && userDict.TryGetValue(pro.ArtisanId, out var user))
            {
                pro.DisplayName = user.DisplayName;
                pro.ShopName = user.ShopName;
            }

            if (ratingDict.TryGetValue(pro.Id, out var rating))
            {
                pro.Rating = (double)rating;
            }
            else
            {
                pro.Rating = 0;
            }

            if (imageDict.TryGetValue(pro.Id, out var img) && img != null)
            {
                pro.ImageUrl = img.URL;
            }
        }

        return mapped;
    }



    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetAvailableProductsAsync()
    {
        var products = await _context.Products.GetAvailableProductsAsync();
        return await MapAndEnrichProductsAsync(products);
    }

    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetUnavailableProductsAsync()
    {
        var products = await _context.Products.GetUnavailableProductsAsync();
        return await MapAndEnrichProductsAsync(products);
    }

    public async Task<ResponseDTOProductDetail> GetProductByIdAsync(string id)
    {
        var product = await _context.Products.GetProductByIdAsync(id);
        if (product == null)
            return null;

        var resultProduct = _mapper.Map<ResponseDTOProductDetail>(product);

        var user = await _context.Users.GetUserByArtisanIDAsync(resultProduct.ArtisanId);
        if (user != null)
        {
            resultProduct.DisplayName = user.DisplayName;
            resultProduct.ShopName = user.ShopName;
        }

        var ratings = (await _context.Feedback.GetFeedbacksByProductIdAsync(resultProduct.Id))?.ToList() ?? new List<Feedback>();
        resultProduct.Rating = (double)(ratings.Count > 0
            ? ratings.Average(o => o.Rating)
            : 0);

        var listImages = (await _context.ProductImages.GetImagesByProductIdAsync(resultProduct.Id))?.OrderBy(i => i.Position).Select(o => o.URL).ToList() ?? new List<string>();
        resultProduct.Images = listImages;

        return resultProduct;
    }


    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetAllProductsAsync()
    {
        var products = await _context.Products.GetAllProductsAsync();
        return _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponseDTOProduct>>(products);
    }

    public async Task<bool> CreateProductAsync(RequestDTOProduct productDto)
    {
        var newProduct = _mapper.Map<Product>(productDto);
        newProduct.Id = GenerateID("PROD");
        newProduct.IsActive = true;
        newProduct.CreateAt = DateTime.UtcNow;
        newProduct.UpdateAt = DateTime.UtcNow;
        var textToEmbed = $"{newProduct.Name} {newProduct.ShortDescription} {newProduct.LongDescription}".Trim();

// Batch embedding
        var embeddingsDict = await _embeddingService.GenerateEmbeddingBatchAsync(new[] { textToEmbed });

        if (!embeddingsDict.TryGetValue(textToEmbed, out var embedding))
        {
            embedding = _embeddingService.GetCachedEmbedding(textToEmbed);
            if (embedding == null)
                throw new Exception("Failed to generate embedding for product text.");
        }

// Chuy?n embedding array thành JsonDocument
        var embeddingJsonString = JsonSerializer.Serialize(embedding);
        newProduct.EmbeddingJson = JsonDocument.Parse(embeddingJsonString);

        // Thêm s?n ph?m
        await _context.Products.AddProductAsync(newProduct);

        // Upload hình ?nh
        if (productDto.Images != null && productDto.Images.Any())
        {
            int position = 0;
            foreach (var file in productDto.Images)
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream)
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                var productImage = new ProductImage
                {
                    Id = GenerateID("PIMG"),
                    ProductId = newProduct.Id,
                    URL = uploadResult.SecureUrl.ToString(),
                    Position = position++
                };
                await _context.ProductImages.AddProductImageAsync(productImage);
            }
        }

        return true;
    }


    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByArtisanIdAsync(string artisanId)
    {
        var products = await _context.Products.GetProductsByArtisanIdAsync(artisanId);
        return await MapAndEnrichProductsAsync(products);
    }


    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByCategoryAsync(string categoryId)
    {
        var products = await _context.Products.GetProductsByCategoryAsync(categoryId);
        return await MapAndEnrichProductsAsync(products);
    }


    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByNameAsync(string productName)
    {
        var products = await _context.Products.GetProductsByNameAsync(productName);
        return await MapAndEnrichProductsAsync(products);
    }

    public async Task<bool> UpdateProductAsync(string productId, RequestDTOProduct productDto)
    {
        var existingProduct = await _context.Products.GetProductWithImagesByIdAsync(productId);

        if (existingProduct == null)
            throw new Exception("Product not found");

        // C?p nh?t th?ng tin co b?n
        existingProduct.Name = productDto.Name;
        existingProduct.ShortDescription = productDto.ShortDescription;
        existingProduct.LongDescription = productDto.LongDescription;
        existingProduct.Price = productDto.Price;
        existingProduct.Category = productDto.Category;
        existingProduct.Stock = productDto.Stock;
        existingProduct.UpdateAt = DateTime.UtcNow;

        // C?p nh?t images (x?a c? -> th?m m?i)
        if (productDto.Images != null && productDto.Images.Any())
        {
            // X?a ?nh c?
            await _context.ProductImages.RemoveProductImageAsync(existingProduct.ProductImages);

            int position = 0;
            foreach (var file in productDto.Images)
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream)
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                var productImage = new ProductImage
                {
                    Id = GenerateID("PIMG"),
                    ProductId = existingProduct.Id,
                    URL = uploadResult.SecureUrl.ToString(),
                    Position = position++
                };

                await _context.ProductImages.AddProductImageAsync(productImage);
            }
        }

        var textForEmbedding = $"{existingProduct.Name} {existingProduct.ShortDescription} {existingProduct.LongDescription}";
        var embeddingVector = await _embeddingService.GenerateEmbeddingAsync(textForEmbedding);

        if (embeddingVector.Length > 0)
        {
            var embeddingJsonString = JsonSerializer.Serialize(embeddingVector);
            existingProduct.EmbeddingJson = JsonDocument.Parse(embeddingJsonString);
        }
        await _context.Products.UpdateAsync(existingProduct);
        return true;
    }

    public async Task<PagedResult<ResponseDTOProduct>> GetProductsAsync(
        string? productName,
        string? categoryId,
        bool? isActive,
        int pageIndex,
        int pageSize,
        string? sortOrder)
    {
        if (pageIndex < 1)
            pageIndex = 1;
        if (pageSize <= 0)
            pageSize = 10;

        var pagedProducts = await _context.Products.GetProductsAsync(
            productName,
            categoryId,
            isActive,
            pageIndex,
            pageSize,
            sortOrder);

        var result = await MapAndEnrichProductsAsync(pagedProducts.Items);

        return new PagedResult<ResponseDTOProduct>
        {
            TotalCount = pagedProducts.TotalCount,
            PageIndex = pageIndex,
            PageSize = pageSize,
            Items = result
        };
    }

    private double CalculateCosineSimilarity(double[] a, double[] b)
    {
        if (a == null || b == null || a.Length != b.Length) return 0;
        double dot = 0, magA = 0, magB = 0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        return dot / (Math.Sqrt(magA) * Math.Sqrt(magB));
    }


    public async Task<bool> DeleteProductAsync(string productId)
    {
        var product = await _context.Products.GetProductByIdAsync(productId);
        product.IsActive = false;
        await _context.Products.UpdateAsync(product);
        return true;
    }


    public static string GenerateID(string prefix)
    {   
        
        string timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");

        return $"{prefix}-{timestamp}";
    }
}
