using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;
[Microsoft.AspNetCore.Components.Route("api/[controller]")]
[ApiController]
public class FeedbackController: ControllerBase
{
    private readonly IFeedbackRepositories _feedbackRepository;

    public FeedbackController(IFeedbackRepositories feedbackRepository)
    {
        _feedbackRepository = feedbackRepository;
    }

    [HttpGet("feedbacks/{productID}")]
    public async Task<ActionResult<IEnumerable<Feedback>>> GetFeedbacks(string productID)
    {
        var feedbacks= await _feedbackRepository.GetFeedbacksByProductIdAsync(productID);
        return Ok(feedbacks);
    }

    [HttpDelete("feedbacks/{ID}")]
    public async Task<ActionResult> DeleteFeedback(string ID)
    {
        await _feedbackRepository.DeleteFeedbacksByIdAsync(ID);
        return NoContent();
    }

    [HttpPut("feedbacks")]
    public async Task<ActionResult> UpdateFeedback(RequestDTOFeedback feedback, string productID, string userID,string feedbackID)
    {
        await _feedbackRepository.UpdateFeedbackByIdAsynnc(feedback, productID, userID, feedbackID);
        return NoContent();
    }

    [HttpPost("feedbacks")]
    public async Task<ActionResult> AddFeedback(RequestDTOFeedback feedback, string productID, string userID)
    {
        await _feedbackRepository.CreateFeedback(feedback, productID, userID);
        return NoContent();
    }
}