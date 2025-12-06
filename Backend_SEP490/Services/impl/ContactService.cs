using System.Net;
using System.Text;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.Extensions.Configuration;

namespace Backend_SEP490.Services.impl;

public class ContactService : IContactService
{
    private readonly IEmailService _emailService;
    private readonly string _contactReceiver;

    public ContactService(IEmailService emailService, IConfiguration configuration)
    {
        _emailService = emailService;
        _contactReceiver = Environment.GetEnvironmentVariable("EMAIL_USERNAME")
                            ?? configuration["Email:Username"]
                            ?? throw new Exception("EMAIL_USERNAME is not configured.");
    }

    public async Task SubmitContactRequestAsync(ContactRequest request)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var encodedName = WebUtility.HtmlEncode(request.Name);
        var encodedEmail = WebUtility.HtmlEncode(request.Email);
        var encodedPhone = WebUtility.HtmlEncode(request.PhoneNumber);

        string messageContent;
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            messageContent = $"Người dùng {encodedName} muốn liên hệ với bạn.";
        }
        else
        {
            messageContent = WebUtility.HtmlEncode(request.Message)
                .Replace("\r", string.Empty)
                .Replace("\n", "<br/>");
        }

        var bodyBuilder = new StringBuilder();
        bodyBuilder.AppendLine("<h3>Yêu cầu liên hệ mới</h3>");
        bodyBuilder.AppendLine($"<p><strong>Họ và tên:</strong> {encodedName}</p>");
        bodyBuilder.AppendLine($"<p><strong>Email:</strong> {encodedEmail}</p>");
        bodyBuilder.AppendLine($"<p><strong>Số điện thoại:</strong> {encodedPhone}</p>");
        bodyBuilder.AppendLine("<p><strong>Nội dung:</strong></p>");
        bodyBuilder.AppendLine($"<p>{messageContent}</p>");
        bodyBuilder.AppendLine("<hr/>");
        bodyBuilder.AppendLine("<p><strong>Thông tin liên hệ:</strong></p>");
        bodyBuilder.AppendLine("<ul>");
        bodyBuilder.AppendLine($"<li>Email: {encodedEmail}</li>");
        bodyBuilder.AppendLine($"<li>Số điện thoại: {encodedPhone}</li>");
        bodyBuilder.AppendLine("</ul>");

        var subject = $"[Contact] {request.Name} muốn liên hệ với bạn";
        await _emailService.SendEmailAsync(_contactReceiver, subject, bodyBuilder.ToString());
    }
}
