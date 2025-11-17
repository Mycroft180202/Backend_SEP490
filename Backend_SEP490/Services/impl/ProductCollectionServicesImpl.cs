using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Repositories.impl;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using System;

namespace Backend_SEP490.Services.impl;

public class ProductCollectionServicesImpl: GenericServices, IProductCollectionServices
{
    private readonly Cloudinary _cloudinary;
    public ProductCollectionServicesImpl(IMapper mapper, IUnitOfWork unitOfWork,Cloudinary cloudinary) : base(mapper, unitOfWork)
    {
        _cloudinary = cloudinary;
    }

    public async Task<IEnumerable<ResponseDTOProductCollection>> GetAllProducts()
    {
        var products = await _context.ProductCollections.GetAllProductsCollection();
        var result = _mapper.Map<IEnumerable<ResponseDTOProductCollection>>(products);
        return result;
    }

    public async Task<ResponseDTOProductCollectionDetail> GetProductCollectionById(int id)
    {
        var productCollection = await _context.ProductCollections.GetProductCollectionById(id);
        var product = await _context.ProductCollections.GetAllProductsInCollection(id);
        var result = _mapper.Map<ResponseDTOProductCollectionDetail>(productCollection);
        result.Products = _mapper.Map<ICollection<ResponseDTOProduct>>(product);
        return result;
    }

    public async Task<ProductCollection> CreateAsync(RequestDTOCreateProductCollection dto)
    {
        string url = "";
        try
        {
            if (dto.ImageFile != null)
            {
                using var stream = dto.ImageFile.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(dto.ImageFile.FileName, stream)
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                url = uploadResult.SecureUrl.ToString();
            }
        }
       
        catch (Exception ex)
        {
            return null;
        }



        // Tạo entity mới
        var entity = new ProductCollection
        {   
            Title = dto.Title,
            Headline = dto.Headline,
            Content = dto.Content,
            Image = url,
            CreatedDate = DateTime.UtcNow,
            CreatedById = dto.CreatedById,
            IsActive = true
        };

        if (dto.ProductIds != null && dto.ProductIds.Any())
        {
            try
            {
                var products = await _context.ProductCollections.GetProductsByIdsAsync(dto.ProductIds);
                entity.ProductCollectionItems = products;
            }
            catch (Exception ex)
            {
                return null;
            }
           
        }

        await _context.ProductCollections.AddAsync(entity);
        await _context.ProductCollections.SaveChangesAsync();

        return entity;
    }
    public static string GenerateID(string prefix)
    {   
        
        string timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");

        return $"{prefix}-{timestamp}";
    }
    public async Task<bool> SoftDeleteProductCollectionAsync(int id, string updatedByUserId)
    {
        var collection = await _context.ProductCollections.GetByIdAsync(id);
        if (collection == null || !collection.IsActive)
            return false;

        collection.UpdatedById = updatedByUserId;
        await _context.ProductCollections.SoftDeleteAsync(collection);
        return true;
    }

    public async Task<bool> UpdateProductCollectionAsync(RequestDTOUpdateProductCollection dto, string updatedById)
    {
        var collection = await _context.ProductCollections.GetByIdAsync(dto.ProductCollectionId);
        if (collection == null) return false;

        string url = collection.Image;
        try
        {
            if (dto.Image != null)
            {
                using var stream = dto.Image.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(dto.Image.FileName, stream)
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                url = uploadResult.SecureUrl.ToString();
            }
        }

        catch (Exception ex)
        {
            return false;
        }

        if (!string.IsNullOrEmpty(dto.Title)) collection.Title = dto.Title;
        if (!string.IsNullOrEmpty(dto.Headline)) collection.Headline = dto.Headline;
        if (!string.IsNullOrEmpty(dto.Content)) collection.Content = dto.Content;
        if (dto.IsActive != null) collection.IsActive = dto.IsActive;
        if (!string.IsNullOrEmpty(url)) collection.Image = url;

        collection.UpdatedDate = DateTime.UtcNow;
        collection.UpdatedById = updatedById;

        await _context.ProductCollections.UpdateAsync(collection, dto.ProductIds);
        return true;
    }

    public async Task<bool> DeleteProductCollectionAsync(int id)
    {
        var collection = await _context.ProductCollections.GetByIdAsync(id);
        if (collection == null) return false;

        return await _context.ProductCollections.DeleteAsync(collection);
    }
}