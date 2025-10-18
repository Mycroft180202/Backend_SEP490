using System.Net;
using System.Net.Mail;
using AutoMapper;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class EmailServiceImpl: GenericServices,IEmailService
{
    private readonly IConfiguration _config;
    public EmailServiceImpl(IMapper mapper, IUnitOfWork unitOfWork, IConfiguration config) : base(mapper, unitOfWork)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var smtpClient = new SmtpClient("smtp.gmail.com")
        {
            Port = 587,
            Credentials = new NetworkCredential(
                _config["Email:Username"],
                _config["Email:Password"]
            ),
            EnableSsl = true,
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(_config["Email:Username"]),
            Subject = subject,
            Body = body,
            IsBodyHtml = true,
        };

        mailMessage.To.Add(to);

        await smtpClient.SendMailAsync(mailMessage);
    }
}