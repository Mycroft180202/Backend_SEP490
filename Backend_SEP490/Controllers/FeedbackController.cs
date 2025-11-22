using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Models;
using Backend_SEP490.Services.impl;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Microsoft.AspNetCore.Components.Route("api/[controller]")]
[ApiController]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackServices _feedbackRepository;

    public FeedbackController(IFeedbackServices feedbackRepository)
    {
        _feedbackRepository = feedbackRepository;
    }

    [HttpGet("feedbacks/{productId}")]
    public async Task<ActionResult<PagedResult<ResponseDTOFeedback>>> GetFeedbacks(
        string productId, int pageIndex = 1, int pageSize = 5)
    {
        var feedbacks = await _feedbackRepository.GetFeedbacksByProductIdAsync(productId, pageIndex, pageSize);
        return Ok(feedbacks);
    }

    [Authorize]
    [HttpDelete("feedbacks")]
    public async Task<ActionResult> DeleteFeedback(String feedbackid,String IdduserId)
    {
        var userId = User.GetUserId();
        if (!string.IsNullOrWhiteSpace(userId) && userId == IdduserId)
        {
            await _feedbackRepository.DeleteFeedbacksByIdAsync(feedbackid);
        }

        return NoContent();
    }

    [Authorize]
    [HttpPut("feedbacks")]
    public async Task<ActionResult> UpdateFeedback(RequestDTOFeedback feedback, string productid, string userid, string feedbackid)
    {
        var currentUserId = User.GetUserId();
        if (!string.IsNullOrWhiteSpace(currentUserId) && currentUserId == userid)
        {
            await _feedbackRepository.UpdateFeedbackByIdAsynnc(feedback, productid, feedbackid);
        }

        return NoContent();
    }
    [Authorize]
    [HttpPost("feedbacks")]
    public async Task<ActionResult> AddFeedback(RequestDTOFeedback feedback, string productid, string userid)
    {
        await _feedbackRepository.CreateFeedback(feedback, productid, userid);
        return NoContent();
    }
}
