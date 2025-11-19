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


    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetAvailableProductsAsync()
    {
        var products = await _context.Products.GetAvailableProductsAsync();

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponseDTOProduct>>(products);

        foreach (var pro in resultproducts)
        {
            // Lấy Artisan
            var user = await _context.Users.GetUserByArtisanIDAsync(pro.ArtisanId);
            if (user != null)
            {
                pro.DisplayName = user.DisplayName;
                pro.ShopName = user.ShopName;
            }

            // Lấy Feedback (Rating)
            var ratings = await _context.Feedback.GetFeedbacksByProductIdAsync(pro.Id);
            if (ratings != null && ratings.Any())
            {
                var ratingSum = ratings.Sum(o => o.Rating);
                pro.Rating = (double)ratingSum / ratings.Count(); // chia double
            }
            else
            {
                pro.Rating = 0;
            }

            // Lấy Image
            var productImages = await _context.ProductImages.GetImagesByProductIdAsync(pro.Id);
            var imageUrl = productImages?.FirstOrDefault(o => o.Position == 1);
            pro.ImageUrl = imageUrl?.URL; // dùng ? để tránh null
        }

        return resultproducts;
    }


    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetUnavailableProductsAsync()
    {
        
        var products = await _context.Products.GetUnavailableProductsAsync();

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponseDTOProduct>>(products);

        foreach (var pro in resultproducts)
        {
            // Artisan info
            var user = await _context.Users.GetUserByArtisanIDAsync(pro.ArtisanId);
            if (user != null)
            {
                pro.DisplayName = user.DisplayName;
                pro.ShopName = user.ShopName;
            }

            // Ratings
            var ratings = await _context.Feedback.GetFeedbacksByProductIdAsync(pro.Id);
            if (ratings != null && ratings.Any())
            {
                var ratingSum = ratings.Sum(o => o.Rating);
                pro.Rating = (double)ratingSum / ratings.Count(); // chia double
            }
            else
            {
                pro.Rating = 0;
            }

            // Product Images
            var productImages = await _context.ProductImages.GetImagesByProductIdAsync(pro.Id);
            var imageUrl = productImages?.FirstOrDefault(o => o.Position == 1);
            pro.ImageUrl = imageUrl?.URL; // tránh null
        }

        return resultproducts;
    }

    

    public async Task<ResponseDTOProductDetail> GetProductByIdAsync(string id)
    {
        var product = await _context.Products.GetProductByIdAsync(id);
        if (product == null)
            return null;

        var resultProduct = _mapper.Map<ResponseDTOProductDetail>(product);

        // Artisan Info
        var user = await _context.Users.GetUserByArtisanIDAsync(resultProduct.ArtisanId);
        if (user != null)
        {
            resultProduct.DisplayName = user.DisplayName;
            resultProduct.ShopName = user.ShopName;
        }

        // Feedback (Rating)
        var ratings = await _context.Feedback.GetFeedbacksByProductIdAsync(resultProduct.Id);
        if (ratings != null && ratings.Any())
        {
            var ratingSum = ratings.Sum(o => o.Rating);
            resultProduct.Rating = (double)ratingSum / ratings.Count();
        }
        else
        {
            resultProduct.Rating = 0;
        }

        // Product Images
        var listImages = await _context.ProductImages.GetImagesByProductIdAsync(resultProduct.Id);
        resultProduct.Images = listImages?.Select(o => o.URL).ToList() ?? new List<string>();

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

// Chuyển embedding array thành JsonDocument
        var embeddingJsonString = JsonSerializer.Serialize(embedding);
        newProduct.EmbeddingJson = JsonDocument.Parse(embeddingJsonString);

        // Thêm sản phẩm
        await _context.Products.AddProductAsync(newProduct);

        // Upload hình ảnh
        //if (productDto.images != null && productDto.images.Any())
        //{
        //    int position = 0;
        //    foreach (var file in productDto.images)
        //    {
        //        using var stream = file.OpenReadStream();
        //        var uploadParams = new ImageUploadParams
        //        {
        //            File = new FileDescription(file.FileName, stream)
        //        };

        //        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

        //        var productImage = new ProductImage
        //        {
        //            Id = GenerateID("PIMG"),
        //            ProductId = newProduct.Id,
        //            URL = uploadResult.SecureUrl.ToString(),
        //            Position = position++
        //        };
        //        await _context.ProductImages.AddProductImageAsync(productImage);
        //    }
        //}

        return true;
    }

    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByArtisanIdAsync(string artisanId)
    {
        var products = await _context.Products.GetProductsByArtisanIdAsync(artisanId);

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponseDTOProduct>>(products);

        foreach (var pro in resultproducts)
        {
            // Artisan info
            var user = await _context.Users.GetUserByArtisanIDAsync(pro.ArtisanId);
            if (user != null)
            {
                pro.DisplayName = user.DisplayName;
                pro.ShopName = user.ShopName;
            }

            // Ratings
            var ratings = await _context.Feedback.GetFeedbacksByProductIdAsync(pro.Id);
            if (ratings != null && ratings.Any())
            {
                var ratingSum = ratings.Sum(o => o.Rating);
                pro.Rating = (double)ratingSum / ratings.Count(); // chia double
            }
            else
            {
                pro.Rating = 0;
            }

            // Product Images
            var productImages = await _context.ProductImages.GetImagesByProductIdAsync(pro.Id);
            var imageUrl = productImages?.FirstOrDefault(o => o.Position == 1);
            pro.ImageUrl = imageUrl?.URL; // tránh null
        }

        return resultproducts;
    }

    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByCategoryAsync(string categoryId)
    {
        var products = await _context.Products.GetProductsByCategoryAsync(categoryId);

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponseDTOProduct>>(products);

        foreach (var pro in resultproducts)
        {
            // Artisan info
            var user = await _context.Users.GetUserByArtisanIDAsync(pro.ArtisanId);
            if (user != null)
            {
                pro.DisplayName = user.DisplayName;
                pro.ShopName = user.ShopName;
            }

            // Ratings
            var ratings = await _context.Feedback.GetFeedbacksByProductIdAsync(pro.Id);
            if (ratings != null && ratings.Any())
            {
                var ratingSum = ratings.Sum(o => o.Rating);
                pro.Rating = (double)ratingSum / ratings.Count(); // chia double
            }
            else
            {
                pro.Rating = 0;
            }

            // Product Images
            var productImages = await _context.ProductImages.GetImagesByProductIdAsync(pro.Id);
            var imageUrl = productImages?.FirstOrDefault(o => o.Position == 1);
            pro.ImageUrl = imageUrl?.URL; // tránh null
        }

        return resultproducts;
    }

    public async Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByNameAsync(string productName)
    {
        var products = await _context.Products.GetProductsByNameAsync(productName);

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponseDTOProduct>>(products);

        foreach (var pro in resultproducts)
        {
            // Artisan info
            var user = await _context.Users.GetUserByArtisanIDAsync(pro.ArtisanId);
            if (user != null)
            {
                pro.DisplayName = user.DisplayName;
                pro.ShopName = user.ShopName;
            }

            // Ratings
            var ratings = await _context.Feedback.GetFeedbacksByProductIdAsync(pro.Id);
            if (ratings != null && ratings.Any())
            {
                var ratingSum = ratings.Sum(o => o.Rating);
                pro.Rating = (double)ratingSum / ratings.Count(); // chia double
            }
            else
            {
                pro.Rating = 0;
            }

            // Product Images
            var productImages = await _context.ProductImages.GetImagesByProductIdAsync(pro.Id);
            var imageUrl = productImages?.FirstOrDefault(o => o.Position == 1);
            pro.ImageUrl = imageUrl?.URL; // tránh null
        }

        return resultproducts;
    }

    public async Task<bool> UpdateProductAsync(string productId, RequestDTOProduct productDto)
{
    var existingProduct = await _context.Products.GetProductWithImagesByIdAsync(productId);

    if (existingProduct == null)
        throw new Exception("Product not found");

    // Cập nhật thông tin cơ bản
    existingProduct.Name = productDto.Name;
    existingProduct.ShortDescription = productDto.ShortDescription;
    existingProduct.LongDescription = productDto.LongDescription;
    existingProduct.Price = productDto.Price;
    existingProduct.Category = productDto.Category;
    existingProduct.Stock = productDto.Stock;
    existingProduct.UpdateAt = DateTime.UtcNow;

    // Cập nhật images (xóa cũ -> thêm mới)
    //if (productDto.images != null && productDto.images.Any())
    //{
    //    // Xóa ảnh cũ
    //    await _context.ProductImages.RemoveProductImageAsync(existingProduct.ProductImages);

    //    int position = 0;
    //    foreach (var file in productDto.images)
    //    {
    //        using var stream = file.OpenReadStream();
    //        var uploadParams = new ImageUploadParams
    //        {
    //            File = new FileDescription(file.FileName, stream)
    //        };

    //        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

    //        var productImage = new ProductImage
    //        {
    //            Id = GenerateID("PIMG"),
    //            ProductId = existingProduct.Id,
    //            URL = uploadResult.SecureUrl.ToString(),
    //            Position = position++
    //        };

    //        await _context.ProductImages.AddProductImageAsync(productImage);
    //    }
    //}

   
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
        string? productName, string? categoryId, bool? isActive, int pageIndex, int pageSize)
    {
        var products = await _context.Products.GetProductsAsync(categoryId, isActive);

        if (!string.IsNullOrEmpty(productName))
        {
            var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(productName);

            var ranked = products
                .Where(p => p.EmbeddingJson != null)
                .Select(p => new
                {
                    Product = p,
                    Score = CalculateCosineSimilarity(
                        queryEmbedding,
                        JsonConvert.DeserializeObject<double[]>(p.EmbeddingJson!.RootElement.GetRawText())
                    )
                })
                .OrderByDescending(x => x.Score)
                .Select(x => x.Product)
                .ToList();

            products = ranked;
        }

        var totalCount = products.Count;
        var paged = products.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToList();
        var result = _mapper.Map<List<ResponseDTOProduct>>(paged);
        foreach (var pro in result)
        {
            var image = await _context.ProductImages.GetImagesByProductIdAsync(pro.Id);
            pro.ImageUrl = image.FirstOrDefault(p=>p.Position == 0)?.URL;
        }
        return new PagedResult<ResponseDTOProduct>
        {
            TotalCount = totalCount,
            Items =result
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