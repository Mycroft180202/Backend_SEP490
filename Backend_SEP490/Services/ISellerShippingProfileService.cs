using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services;

public interface ISellerShippingProfileService
{
    Task<SellerShippingProfileDto?> GetMyProfileAsync(string sellerId);
    Task<SellerShippingProfileDto> UpsertMyProfileAsync(string sellerId, UpsertSellerShippingProfileRequest request);
}
