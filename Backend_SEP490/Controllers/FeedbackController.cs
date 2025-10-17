using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;

using Backend_SEP490.Services.impl;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;
[Microsoft.AspNetCore.Components.Route("api/[controller]")]
[ApiController]
public class FeedbackController: ControllerBase
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

    [HttpDelete("feedbacks/{ID}")]
    public async Task<ActionResult> DeleteFeedback(string id)
    {
        await _feedbackRepository.DeleteFeedbacksByIdAsync(id);
        return NoContent();
    }

    [HttpPut("feedbacks")]
    public async Task<ActionResult> UpdateFeedback(RequestDTOFeedback feedback, string productid, string userid,string feedbackid)
    {
        await _feedbackRepository.UpdateFeedbackByIdAsynnc(feedback, productid, userid, feedbackid);
        return NoContent();
    }

    [HttpPost("feedbacks")]
    public async Task<ActionResult> AddFeedback(RequestDTOFeedback feedback, string productid, string userid)
    {
        await _feedbackRepository.CreateFeedback(feedback, productid, userid);
        return NoContent();
    }
}