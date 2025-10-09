using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

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


    public async Task<IEnumerable<RequestDTOProduct>> GetAvailableProductsAsync()
    {
        var products = await _context.Products.GetAvailableProductsAsync();

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<RequestDTOProduct>>(products);

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


    public async Task<IEnumerable<RequestDTOProduct>> GetUnavailableProductsAsync()
    {
        
        var products = await _context.Products.GetUnavailableProductsAsync();

        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<RequestDTOProduct>>(products);

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

    

    public async Task<RequestDTOProductDetail> GetProductByIdAsync(string id)
    {
        var product = await _context.Products.GetProductByIdAsync(id);
        if (product == null)
            return null;

        var resultProduct = _mapper.Map<RequestDTOProductDetail>(product);

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


    public async Task<IEnumerable<RequestDTOProduct>> GetAllProductsAsync()
    {
        var products = await _context.Products.GetAllProductsAsync();
        return _mapper.Map<IEnumerable<Product>, IEnumerable<RequestDTOProduct>>(products);
    }

    public async Task<bool> CreateProductAsync(ResponseDTOProduct productDto)
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

    public static string GenerateID(string prefix)
    {   
        
        string timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");

        return $"{prefix}-{timestamp}";
    }
}