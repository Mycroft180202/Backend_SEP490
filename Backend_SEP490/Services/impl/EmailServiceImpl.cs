using System.Net;
using System.Net.Mail;
using AutoMapper;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class EmailServiceImpl : GenericServices, IEmailService
{
    private readonly string _emailHost;
    private readonly int _emailPort;
    private readonly string _emailUsername;
    private readonly string _emailPassword;

    public EmailServiceImpl(IMapper mapper, IUnitOfWork unitOfWork, IConfiguration config) 
        : base(mapper, unitOfWork)
    {
        // Load từ environment variables hoặc fallback sang appsettings
        _emailHost = Environment.GetEnvironmentVariable("EMAIL_HOST") ?? config["Email:Host"];
        _emailPort = int.Parse(Environment.GetEnvironmentVariable("EMAIL_PORT") ?? config["Email:Port"] ?? "587");
        _emailUsername = Environment.GetEnvironmentVariable("EMAIL_USERNAME") ?? config["Email:Username"];
        _emailPassword = Environment.GetEnvironmentVariable("EMAIL_PASSWORD") ?? config["Email:Password"];

        if (string.IsNullOrEmpty(_emailHost) || string.IsNullOrEmpty(_emailUsername) || string.IsNullOrEmpty(_emailPassword))
            throw new Exception("Email configuration is not properly set.");
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        if (string.IsNullOrEmpty(to))
            throw new ArgumentException("Recipient email cannot be null or empty", nameof(to));

        using var smtpClient = new SmtpClient(_emailHost)
        {
            Port = _emailPort,
            Credentials = new NetworkCredential(_emailUsername, _emailPassword),
            EnableSsl = true
        };

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
}