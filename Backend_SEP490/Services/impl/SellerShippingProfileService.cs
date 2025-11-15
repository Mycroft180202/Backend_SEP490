using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Microsoft.Extensions.Logging;

namespace Backend_SEP490.Services.impl;

public class SellerShippingProfileService : GenericServices, ISellerShippingProfileService
{
    private readonly ILogger<SellerShippingProfileService> _logger;

    public SellerShippingProfileService(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        ILogger<SellerShippingProfileService> logger) : base(mapper, unitOfWork)
    {
        _logger = logger;
    }

    public async Task<SellerShippingProfileDto?> GetMyProfileAsync(string sellerId)
    {
        if (string.IsNullOrWhiteSpace(sellerId))
        {
            return null;
        }

        var profile = await _context.SellerShippingProfiles.GetBySellerIdAsync(sellerId);
        return profile == null ? null : _mapper.Map<SellerShippingProfileDto>(profile);
    }

    public async Task<SellerShippingProfileDto> UpsertMyProfileAsync(string sellerId, UpsertSellerShippingProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(sellerId))
        {
            throw new ArgumentException("Seller id is required.", nameof(sellerId));
        }

        var profile = await _context.SellerShippingProfiles.GetBySellerIdAsync(sellerId);
        if (profile == null)
        {
            profile = new SellerShippingProfile
            {
                Id = $"SSP-{sellerId}-{Guid.NewGuid():N}",
                SellerId = sellerId,
                CreatedAt = DateTime.UtcNow
            };
            await _context.SellerShippingProfiles.AddAsync(profile);
        }

        profile.PickupContactName = request.PickupContactName;
        profile.PickupContactPhone = request.PickupContactPhone;
        profile.PickupAddressLine = request.PickupAddressLine;
        profile.PickupProvinceName = request.PickupProvinceName;
        profile.PickupDistrictId = request.PickupDistrictId;
        profile.PickupWardCode = request.PickupWardCode;
        profile.GhnToken = request.GhnToken;
        profile.GhnShopId = request.GhnShopId;
        profile.IsActive = request.IsActive;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Seller {SellerId} updated shipping profile.", sellerId);
        return _mapper.Map<SellerShippingProfileDto>(profile);
    }
}
