using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Services;
using CloudinaryDotNet;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Transactions;
using static System.Net.WebRequestMethods;

namespace Backend_SEP490.IntegrationTests.Auth
{
    //Integration Test : Kiểm tra sự tương tác giữa nhiều tầng/lớp(API + DB + service thật)
    public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly AppDbContext _db;
        public AuthControllerTests(CustomWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();

            var scope = factory.Services.CreateScope();
            _db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            //_db.Users.RemoveRange(_db.Users); 
            //_db.Users.Add(new User
            //{
            //    Username = "admin",
            //    PasswordHash = "123456",
            //    Email = "admin@test.com"
            //});
            //_db.SaveChanges();
        }

        [Fact] // dinh nghia la 1 phuong thuc test
        public async Task POST_Login_ShouldReturnUnauthorized_WhenInvalidCredentials()
        {
            // Arrange
            var formData = new Dictionary<string, string>
            {
                { "Username", "admin" },
                { "Password", "wrong_pass" }
            };
            var content = new FormUrlEncodedContent(formData);
            var response = await _client.PostAsync("/login", content);
            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task POST_Login_ShouldReturnOk_WhenValidCredentials()
        {
            // Arrange
            var formData = new Dictionary<string, string>
            {
                { "Username", "MinhBDHE170083" },
                { "Password", "MinhG2k3vn" }
            };
            var loginRequest = new FormUrlEncodedContent(formData);
            // Act
            var response = await _client.PostAsync("/login", loginRequest);
            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        [Fact]
        public async Task Register_Then_VerifyOtp_Success()
        {
            var emailTest = "trandinhkhanh180502@gmail.com";
            try { 
                // Arrange
                var formData = new Dictionary<string, string>
                    {
                        { "Username", "testuser_integration" },
                        { "PasswordHash", "Test@123" },
                        { "Email", $"{emailTest}" },
                        { "PhoneNumber", "0123456789" },
                        { "DisplayName", "Integration Tester" },
                        { "Dob", "" } 
                    };
                var content = new FormUrlEncodedContent(formData);
                // Act
                var registerResponse = await _client.PostAsync("/register", content);
                // Assert
                registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
                var registerMessage = await registerResponse.Content.ReadAsStringAsync();
                registerMessage.Should().Contain("OTP sent to email");

                // Get OTP Code
                var otpSent = await _db.UserOtps
                      .Where(x => x.Email == "trandinhkhanh180502@gmail.com" && !x.IsUsed)
                      .OrderByDescending(x => x.CreatedAt)
                      .FirstOrDefaultAsync();
                if (otpSent != null)
                {
                    var registerRequest = new RequestDTORegister { Username = "testuser_integration", PasswordHash = "Test@123", Email = emailTest, PhoneNumber = "0123456789", DisplayName = "Integration Tester", Dob = null, };
                    var verifyRequest = new RequestDTOVerifyOtp
                    {
                        RegisterDto = registerRequest,
                        Otp = otpSent.OtpCode,
                    };

                    var verifyResponse = await _client.PostAsJsonAsync("/verify-otp", verifyRequest);
                    verifyResponse.StatusCode.Should().Be(HttpStatusCode.OK);
                    var verifyMessage = await verifyResponse.Content.ReadAsStringAsync();
                    verifyMessage.Should().Contain("Registration successful");
                }
            }
            finally
            {
                // Rollback
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == emailTest);
                if (user != null)
                {
                    _db.Users.Remove(user);
                    await _db.SaveChangesAsync();
                }
                var otps = _db.UserOtps.Where(o => o.Email == emailTest);
                _db.UserOtps.RemoveRange(otps);
                await _db.SaveChangesAsync();
            }
        }
        // forgot password
        [Fact]
        public async Task POST_ForgotPassword_ShouldReturnOk_WhenEmailExists()
        {
            var existingEmail = "trandinhkhanh180502@gmail.com"; 
            // Act
            var response = await _client.PostAsJsonAsync("/forgot-password", existingEmail);
            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var message = await response.Content.ReadAsStringAsync();
            message.Should().Contain("OTP đã được gửi tới email của bạn.");
        }
        [Fact]
        public async Task POST_ForgotPassword_ShouldReturnBadRequest_WhenEmailDoesNotExist()
        {
            // Arrange
            var nonExistingEmail = "notfoundemail@gmail.com";
            // Act
            var response = await _client.PostAsJsonAsync("/forgot-password", nonExistingEmail);
            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            var message = await response.Content.ReadAsStringAsync();
            message.Should().Contain("Email không tồn tại trong hệ thống.");
        }
        // Reset password
        [Fact]
        public async Task ResetPassword_ShouldReturnOk_WhenOtpValid()
        {
            // Arrange
            var email = "user@example.com";
            var otpCode = "123456";
            //await SeedDataHelper.SeedUserAndOtpAsync(factory: _client, email: email, otp: otpCode, isExpired: false, isUsed: false);
            var request = new RequestDTOResetPassword
            {
                Email = email,
                OtpCode = otpCode,
                NewPassword = "NewPassword123!"
            };
            // Act
            var response = await _client.PostAsJsonAsync("/api/auth/reset-password", request);
            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Mật khẩu đã được đặt lại thành công", content);
        }

    }
}
