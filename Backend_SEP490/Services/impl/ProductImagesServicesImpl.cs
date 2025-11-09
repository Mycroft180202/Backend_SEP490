using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;

namespace Backend_SEP490.Services.impl;

public class ProductImagesServicesImpl: GenericServices,IProductImagesServices
{
    private readonly Cloudinary _cloudinary;
    public ProductImagesServicesImpl(IMapper mapper, IUnitOfWork context, Cloudinary cloudinary) : base(mapper, context)
    {
        _cloudinary = cloudinary;
    }

    public async Task<IEnumerable<ResponseDTOProductImages>> GetImagesByProductIdAsync(string productId)
    {
        var images= await _context.ProductImages.GetImagesByProductIdAsync(productId);
        return _mapper.Map<IEnumerable<ResponseDTOProductImages>>(images);
    }

    public async Task<bool> AddProductImageAsync(RequestDTOAddProductImage dto)
    {
        var product = await _context.Products.GetProductByIdAsync(dto.ProductId);
        if (product == null)
            throw new Exception("Product not found");

        int position = 0;
        // Lưu file ảnh vào wwwroot/images/products
        foreach (var file in dto.ImageFile)
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
                ProductId = product.Id,
                URL = uploadResult.SecureUrl.ToString(),
                Position = position++
            };

            await _context.ProductImages.AddProductImageAsync(productImage);
        }

        return true;
    }

    public static string GenerateID(string prefix)
    {   
        
        string timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");

        return $"{prefix}-{timestamp}";
    }
}