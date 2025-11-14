using Backend_SEP490.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/ghn/master-data")]
[ApiController]
public class GhnMasterDataController : ControllerBase
{
    private readonly IGhnMasterDataService _masterDataService;

    public GhnMasterDataController(IGhnMasterDataService masterDataService)
    {
        _masterDataService = masterDataService;
    }

    [HttpGet("provinces")]
    public async Task<IActionResult> GetProvinces(CancellationToken cancellationToken)
    {
        var provinces = await _masterDataService.GetProvincesAsync(cancellationToken);
        return Ok(provinces);
    }

    [HttpGet("districts")]
    public async Task<IActionResult> GetDistricts([FromQuery] int provinceId, CancellationToken cancellationToken)
    {
        if (provinceId <= 0)
        {
            return BadRequest("provinceId is required.");
        }

        var districts = await _masterDataService.GetDistrictsAsync(provinceId, cancellationToken);
        return Ok(districts);
    }

    [HttpGet("wards")]
    public async Task<IActionResult> GetWards([FromQuery] int districtId, CancellationToken cancellationToken)
    {
        if (districtId <= 0)
        {
            return BadRequest("districtId is required.");
        }

        var wards = await _masterDataService.GetWardsAsync(districtId, cancellationToken);
        return Ok(wards);
    }
}
