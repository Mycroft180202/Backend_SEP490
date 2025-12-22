using System.Net;
using System.Net.Mail;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AutoMapper;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class EmailServiceImpl : GenericServices, IEmailService
{
    private readonly string? _emailHost;
    private readonly int _emailPort;
    private readonly string? _emailUsername;
    private readonly string? _emailPassword;
    private readonly string? _resendApiKey;
    private readonly string _fromEmail;
    private readonly IHttpClientFactory _httpClientFactory;

    public EmailServiceImpl(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        IConfiguration config,
        IHttpClientFactory httpClientFactory)
        : base(mapper, unitOfWork)
    {
        _httpClientFactory = httpClientFactory;

        _resendApiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY")
            ?? config["Email:Resend:ApiKey"];

        _fromEmail = Environment.GetEnvironmentVariable("EMAIL_FROM")
            ?? config["Email:From"]
            ?? "onboarding@resend.dev";

        // Load từ environment variables hoặc fallback sang appsettings
        _emailHost = Environment.GetEnvironmentVariable("EMAIL_HOST") ?? config["Email:Host"];
        _emailPort = int.Parse(Environment.GetEnvironmentVariable("EMAIL_PORT") ?? config["Email:Port"] ?? "587");
        _emailUsername = Environment.GetEnvironmentVariable("EMAIL_USERNAME") ?? config["Email:Username"];
        _emailPassword = Environment.GetEnvironmentVariable("EMAIL_PASSWORD") ?? config["Email:Password"];
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        if (string.IsNullOrEmpty(to))
            throw new ArgumentException("Recipient email cannot be null or empty", nameof(to));

        // Render thường chặn outbound SMTP. Ưu tiên gửi qua HTTP email provider nếu có key.
        if (!string.IsNullOrWhiteSpace(_resendApiKey))
        {
            await SendViaResendAsync(to, subject, body);
            return;
        }

        if (string.IsNullOrWhiteSpace(_emailHost)
            || string.IsNullOrWhiteSpace(_emailUsername)
            || string.IsNullOrWhiteSpace(_emailPassword))
        {
            throw new InvalidOperationException(
                "Email service is not configured. Set RESEND_API_KEY (+ EMAIL_FROM) or SMTP EMAIL_HOST/EMAIL_PORT/EMAIL_USERNAME/EMAIL_PASSWORD.");
        }

        using var smtpClient = new SmtpClient(_emailHost, _emailPort)
        {
            EnableSsl = true,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_emailUsername, _emailPassword),
            DeliveryMethod = SmtpDeliveryMethod.Network
        };
        smtpClient.Timeout = 15000;

        var mailMessage = new MailMessage
        {
            From = new MailAddress(_emailUsername),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };

        mailMessage.To.Add(new MailAddress(to));

        await smtpClient.SendMailAsync(mailMessage);
    }

    private async Task SendViaResendAsync(string to, string subject, string htmlBody)
    {
        var client = _httpClientFactory.CreateClient();
        client.BaseAddress = new Uri("https://api.resend.com/");
        client.Timeout = TimeSpan.FromSeconds(15);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _resendApiKey);

        var payload = new
        {
            from = _fromEmail,
            to = new[] { to },
            subject,
            html = htmlBody
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var response = await client.PostAsync("emails", content);
        if (!response.IsSuccessStatusCode)
        {
            var errorText = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Resend email failed: {(int)response.StatusCode} {response.ReasonPhrase}. {errorText}");
        }
    }
}
