using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class ProductServicesImpl: GenericServices, IProductServices
{
    private readonly IUserServices _userServices;
    private readonly IFeedbackServices _feedbackServices;
    private readonly IProductImagesServices _productImagesServices;
    public ProductServicesImpl(IMapper mapper, IUnitOfWork unitOfWork,IUserServices userServices,IFeedbackServices feedbackServices,IProductImagesServices productImagesServices) : base(mapper, unitOfWork)
    {
        _userServices= userServices;
        _feedbackServices = feedbackServices;
        _productImagesServices = productImagesServices;
    }


    public async Task<IEnumerable<RequestDTOProduct>> GetAvailableProductsAsync()
    {
        var products = await _context.Products.GetAvailableProductsAsync();
        var resultproducts = _mapper.Map<IEnumerable<Product>, IEnumerable<RequestDTOProduct>>(products);
        foreach (var pro in resultproducts)
        {
            pro.DisplayName = _context.Users.GetUserByArtisanIDAsync(pro.ArtisanId).Result.DisplayName;
            pro.ShopName = _context.Users.GetUserByArtisanIDAsync(pro.ArtisanId).Result.ShopName;
            var rateting=_context.Feedback.GetFeedbacksByProductIdAsync(pro.Id).Result;
            var ratetingProduct = rateting.Sum(o => o.Rating);
            pro.Rating = (double)(ratetingProduct/rateting.Count());
            var productImages=_context.ProductImages.GetImagesByProductIdAsync(pro.Id).Result;
            var imageUrl = productImages.FirstOrDefault(o => o.Position == 1);
            pro.ImageUrl = imageUrl.URL;
        }
        return resultproducts;
    }

    public async Task<RequestDTOProduct> GetProductByIdAsync(int id)
    {
        var product = await _context.Products.GetProductById(id);
        var result = _mapper.Map<RequestDTOProduct>(product);
        return result;
    }

    public async Task<Boolean> AddProductAsync(RequestDTOProduct product)
    {
        var newProduct = _mapper.Map<Product>(product);
        var result= await _context.Products.AddProduct(newProduct);
        return true;
    }
}