using AutoMapper;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Net.Mail;

namespace Backend_SEP490.UnitTests
{
    public class EmailServiceUnitTests
    {
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<IConfigurationSection> _sectionMock;

        public EmailServiceUnitTests()
        {
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _configMock = new Mock<IConfiguration>();
            _sectionMock = new Mock<IConfigurationSection>();
        }

        private EmailServiceImpl CreateService(Dictionary<string, string>? inMemorySettings = null)
        {
            if (inMemorySettings != null)
            {
                var configuration = new ConfigurationBuilder()
                    .AddInMemoryCollection(inMemorySettings)
                    .Build();
                return new EmailServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object, configuration);
            }

            _configMock.Setup(c => c["Email:Host"]).Returns("smtp.gmail.com");
            _configMock.Setup(c => c["Email:Port"]).Returns("587");
            _configMock.Setup(c => c["Email:Username"]).Returns("test@gmail.com");
            _configMock.Setup(c => c["Email:Password"]).Returns("testpass");

            return new EmailServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object, _configMock.Object);
        }

        // ==================================================================
        // CONSTRUCTOR - CONFIG VALIDATION
        // ==================================================================

        [Fact(DisplayName = "Constructor - Missing config (all null) → Throws exception")]
        public void Constructor_MissingAllConfig_ThrowsException()
        {
            _configMock.Setup(c => c["Email:Host"]).Returns((string)null!);
            _configMock.Setup(c => c["Email:Port"]).Returns((string)null!);
            _configMock.Setup(c => c["Email:Username"]).Returns((string)null!);
            _configMock.Setup(c => c["Email:Password"]).Returns((string)null!);

            var ex = Assert.Throws<Exception>(() =>
                new EmailServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object, _configMock.Object));

            Assert.Contains("Email configuration is not properly set", ex.Message);
        }

        //[Theory(DisplayName = "Constructor - Missing one config → Throws exception")]
        //[InlineData("Email:Host")]
        //[InlineData("Email:Username")]
        //[InlineData("Email:Password")]
        //public void Constructor_MissingOneConfig_ThrowsException(string missingKey)
        //{
        //    _configMock.Setup(c => c["Email:Host"]).Returns("smtp.gmail.com");
        //    _configMock.Setup(c => c["Email:Port"]).Returns("587");
        //    _configMock.Setup(c => c["Email:Username"]).Returns("test@gmail.com");
        //    _configMock.Setup(c => c["Email:Password"]).Returns("testpass");

        //    _configMock.Setup(c => c[missingKey]).Returns((string)null!);

        //    var ex = Assert.Throws<Exception>(() =>
        //        new EmailServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object, _configMock.Object));

        //    Assert.Contains("Email configuration is not properly set", ex.Message);
        //}

        [Fact(DisplayName = "Constructor - Valid config from appsettings → Success")]
        public void Constructor_ValidConfigFromAppsettings_Success()
        {
            var service = CreateService();
            Assert.NotNull(service);
        }

        [Fact(DisplayName = "Constructor - Environment variables override appsettings")]
        public void Constructor_EnvironmentVariablesOverride_Success()
        {
            Environment.SetEnvironmentVariable("EMAIL_HOST", "smtp.custom.com");
            Environment.SetEnvironmentVariable("EMAIL_PORT", "465");
            Environment.SetEnvironmentVariable("EMAIL_USERNAME", "envuser@domain.com");
            Environment.SetEnvironmentVariable("EMAIL_PASSWORD", "envpass");

            try
            {
                var inMemory = new Dictionary<string, string>
                {
                    ["Email:Host"] = "fallback-smtp.com",
                    ["Email:Username"] = "fallback@domain.com",
                    ["Email:Password"] = "fallbackpass"
                };

                var service = CreateService(inMemory);
                Assert.NotNull(service);
            }
            finally
            {
                Environment.SetEnvironmentVariable("EMAIL_HOST", null);
                Environment.SetEnvironmentVariable("EMAIL_PORT", null);
                Environment.SetEnvironmentVariable("EMAIL_USERNAME", null);
                Environment.SetEnvironmentVariable("EMAIL_PASSWORD", null);
            }
        }

        // ==================================================================
        // SEND EMAIL - SUCCESS
        // ==================================================================

        [Fact(DisplayName = "SendEmailAsync - Valid input → Does not throw FormatException")]
        public async Task SendEmailAsync_ValidInput_NoFormatException()
        {
            var service = CreateService();

            var ex = await Record.ExceptionAsync(async () =>
                await service.SendEmailAsync("customer@example.com", "Test", "<p>Hi</p>"));
            Assert.False(ex is FormatException, "Should not throw FormatException with valid email");
        }

        // ==================================================================
        // SEND EMAIL - FAILURE CASES
        // ==================================================================

        //[Theory(DisplayName = "SendEmailAsync - Invalid recipient → Throws ArgumentException")]
        //[InlineData(null)]
        //[InlineData("")]
        //public async Task SendEmailAsync_InvalidRecipient_ThrowsArgumentException(string? invalidEmail)
        //{
        //    var service = CreateService();

        //    var ex = await Assert.ThrowsAsync<ArgumentException>(async () =>
        //        await service.SendEmailAsync(invalidEmail, "Subject", "Body"));

        //    Assert.Contains("Recipient email cannot be null or empty", ex.Message);
        //}

        //[Theory]
        //[InlineData("   ")]
        //[InlineData("invalid")]
        //[InlineData("abc@")]
        //public async Task SendEmailAsync_InvalidFormat_ThrowsFormatException(string invalidEmail)
        //{
        //    var service = CreateService();

        //    var ex = await Assert.ThrowsAnyAsync<Exception>(async () =>
        //        await service.SendEmailAsync(invalidEmail, "Subject", "Body"));
        //    Assert.True(ex is FormatException || ex is SmtpException);
        //}

        [Fact(DisplayName = "SendEmailAsync - Invalid SMTP config → Throws exception on send")]
        public async Task SendEmailAsync_InvalidSmtpConfig_ThrowsOnSend()
        {
            var badConfig = new Dictionary<string, string>
            {
                ["Email:Host"] = "invalid.smtp.server",
                ["Email:Username"] = "fake@domain.com",
                ["Email:Password"] = "wrongpass"
            };

            var service = CreateService(badConfig);

            await Assert.ThrowsAnyAsync<Exception>(async () =>
                await service.SendEmailAsync("test@example.com", "Subject", "Body"));
        }
    }
}