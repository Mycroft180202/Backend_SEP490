using Backend_SEP490.DTOs.External.Ghn;

namespace Backend_SEP490.Services;

public interface IGhnMasterDataService
{
    Task<IEnumerable<GhnProvince>> GetProvincesAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<GhnDistrict>> GetDistrictsAsync(int provinceId, CancellationToken cancellationToken = default);
    Task<IEnumerable<GhnWard>> GetWardsAsync(int districtId, CancellationToken cancellationToken = default);
}
