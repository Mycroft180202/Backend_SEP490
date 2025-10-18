namespace Backend_SEP490.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
}