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
    
    public static string GenerateID(string prefix)
    {   
        
        string timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");

        return $"{prefix}-{timestamp}";
    }
}