using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace Backend_SEP490.Controllers;
[Microsoft.AspNetCore.Components.Route("api/[controller]")]
[ApiController]
public class VoucherController : ControllerBase
{
    readonly IVoucherService _voucherService;

    public VoucherController(IVoucherService voucherService)
    {
        _voucherService = voucherService;
    }

    [HttpGet("voucher")]
    public async Task<IActionResult> GetAllVoucher([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
    {
        var vouchers = await _voucherService.GetAllVoucherAsync(pageIndex, pageSize);
        if (vouchers == null) return NotFound();
        return Ok(vouchers);
    }


    [HttpGet("voucher/{voucherId}")]
    public async Task<IActionResult> GetVoucherById([FromRoute] int voucherId)
    {
        var vouchers = await _voucherService.GetVoucherByIdAsync(voucherId);
        if (vouchers == null) return NotFound();
        return Ok(vouchers);
    }


    [HttpPost("voucher")]
    public async Task<IActionResult> CreateVoucher([FromQuery] string userId, [FromBody] RequestCreateVoucher request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        var status = await _voucherService.CreateVoucherAsync(userId, request);
        return Ok(status);
    }


    [HttpPut("voucher/{voucherId}")]
    public async Task<IActionResult> UpdateVoucher([FromRoute] int voucherId, [FromBody] RequestUpdateVoucher request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        var status = await _voucherService.UpdateVoucherAsync(voucherId, request);
        return Ok(status);
    }


    [HttpDelete("voucher/{voucherId}")]
    public async Task<IActionResult> CreateVoucher([FromRoute] int voucherId)
    {
        var status = await _voucherService.DeleteVoucherAsync(voucherId);
        return Ok(status);
    }
}