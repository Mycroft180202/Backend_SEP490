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

    [HttpGet("voucher/{pageIndex}/{pageSize}")]
    public async Task<IActionResult> GetAllVoucher([FromRoute] int pageIndex, [FromRoute] int pageSize)
    {
        var vouchers = await _voucherService.GetAllVoucherAsync(pageIndex, pageSize);
        if (vouchers == null) return NotFound();
        return Ok(vouchers);
    }


    [HttpGet("voucher/{voucherId}")]
    public async Task<IActionResult> GetVoucherById([FromRoute] string voucherId)
    {
        var vouchers = await _voucherService.GetVoucherByIdAsync(voucherId);
        if (vouchers == null) return NotFound();
        return Ok(vouchers);
    }


    [HttpPost("voucher")]
    public async Task<IActionResult> CreateVoucher([FromBody] RequestCreateVoucher request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        var userId = User.FindFirstValue("userID");
        var status = await _voucherService.CreateVoucherAsync(userId,request);
        return Ok(status);
    }


    [HttpPut("voucher/{voucherId}")]
    public async Task<IActionResult> UpdateVoucher([FromRoute] string voucherId, [FromBody] RequestUpdateVoucher request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        var status = await _voucherService.UpdateVoucherAsync(voucherId, request);
        return Ok(status);
    }


    [HttpDelete("voucher/{voucherId}")]
    public async Task<IActionResult> CreateVoucher([FromRoute] string voucherId)
    {
        var status = await _voucherService.DeleteVoucherAsync(voucherId);
        return Ok(status);
    }
}