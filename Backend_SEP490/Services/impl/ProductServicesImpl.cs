using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using RequestDTOProduct = Backend_SEP490.DTOs.Response.RequestDTOProduct;

namespace Backend_SEP490.Services.impl;

public class ProductServicesImpl: GenericServices, IProductServices
{
    private readonly IUserServices _userServices;
    private readonly IFeedbackServices _feedbackServices;
    private readonly IProductImagesServices _productImagesServices;
    private readonly Cloudinary _cloudinary;
    public ProductServicesImpl(IMapper mapper, IUnitOfWork unitOfWork,IUserServices userServices,IFeedbackServices feedbackServices,IProductImagesServices productImagesServices , Cloudinary cloudinary) : base(mapper, unitOfWork)
    {
        _userServices= userServices;
        _feedbackServices = feedbackServices;
        _productImagesServices = productImagesServices;
        _cloudinary = cloudinary;
    }


    public async Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetAvailableProductsAsync()
    {
        var products = await _context.Products.GetAvailableProductsAsync();

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponeseDTOProduct>>(products);

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


    public async Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetUnavailableProductsAsync()
    {
        
        var products = await _context.Products.GetUnavailableProductsAsync();

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponeseDTOProduct>>(products);

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


    public async Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetAllProductsAsync()
    {
        var products = await _context.Products.GetAllProductsAsync();
        return _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponeseDTOProduct>>(products);
    }

    public async Task<bool> CreateProductAsync(RequestDTOProduct productDto)
    {
        var newProduct = _mapper.Map<Product>(productDto);
        newProduct.Id = GenerateID("PROD");
        newProduct.IsActive = true;
        newProduct.CreateAt = DateTime.UtcNow;
        newProduct.UpdateAt = DateTime.UtcNow;
        await _context.Products.AddProductAsync(newProduct);
        
        
        if (productDto.images != null)
        {
            int position = 0;
            foreach (var file in productDto.images)
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

    public async Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetProductsByArtisanIdAsync(string artisanId)
    {
        var products = await _context.Products.GetProductsByArtisanIdAsync(artisanId);

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponeseDTOProduct>>(products);

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

    public async Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetProductsByCategoryAsync(string categoryId)
    {
        var products = await _context.Products.GetProductsByCategoryAsync(categoryId);

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponeseDTOProduct>>(products);

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

    public async Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetProductsByNameAsync(string productName)
    {
        var products = await _context.Products.GetProductsByNameAsync(productName);

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<DTOs.Request.ResponeseDTOProduct>>(products);

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
        if (productDto.images != null && productDto.images.Any())
        {
            // Xóa ảnh cũ
            await _context.ProductImages.RemoveProductImageAsync(existingProduct.ProductImages);

            int position = 0;
            foreach (var file in productDto.images)
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

        await _context.Products.UpdateAsync(existingProduct);
        return true;
    }

    public async Task<PagedResult<ResponeseDTOProduct>> GetProductsAsync(
        string? productName, string? categoryId, int pageIndex, int pageSize)
    {
        // Lấy data từ Repository (PagedResult<Product>)
        var products = await _context.Products.GetProductsAsync(productName, categoryId, pageIndex, pageSize);

        // Map danh sách Product -> ResponseDTOProduct
        var mappedItems = _mapper.Map<IEnumerable<ResponeseDTOProduct>>(products.Items);

        // Trả về PagedResult với DTO
        return new PagedResult<ResponeseDTOProduct>
        {
            Items = mappedItems,
            TotalCount = products.TotalCount,
            PageIndex = products.PageIndex,
            PageSize = products.PageSize
        };
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