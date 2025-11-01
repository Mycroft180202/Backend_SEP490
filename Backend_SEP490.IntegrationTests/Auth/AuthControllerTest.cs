using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;

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
        // case normal
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
                await CleanupUser(emailTest);
            }
        }
        #region Username Validation Tests

        [Theory]
        [InlineData("ab", "Tên đăng nhập phải từ 3–30 ký tự")] // Too short
        [InlineData("a", "Tên đăng nhập phải từ 3–30 ký tự")] // Too short
        [InlineData("this_is_a_very_long_username_over_thirty_chars", "Tên đăng nhập phải từ 3–30 ký tự")] // Too long
        public async Task Register_InvalidUsername_ReturnsBadRequest(string username, string expectedError)
        {
            var emailTest = $"username_test_{Guid.NewGuid()}@example.com";
            try
            {
                // Arrange
                var formData = new Dictionary<string, string>
            {
                { "Username", username },
                { "PasswordHash", "Test@123" },
                { "Email", emailTest },
                { "PhoneNumber", "0123456789" }
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                var errorMessage = await response.Content.ReadAsStringAsync();
                errorMessage.Should().Contain(expectedError);
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

        [Fact]
        public async Task Register_EmptyUsername_ReturnsBadRequest()
        {
            var emailTest = "empty_username@example.com";
            try
            {
                // Arrange
                var formData = new Dictionary<string, string>
            {
                { "Username", "" },
                { "PasswordHash", "Test@123" },
                { "Email", emailTest },
                { "PhoneNumber", "0123456789" }
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                var errorMessage = await response.Content.ReadAsStringAsync();
                errorMessage.Should().Contain("Tên đăng nhập không được để trống");
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

       
        #endregion

        #region Password Validation Tests

        [Theory]
        [InlineData("12345", "Mật khẩu phải có ít nhất 6 ký tự")] // Too short
        [InlineData("abc", "Mật khẩu phải có ít nhất 6 ký tự")] // Too short
        [InlineData("", "Mật khẩu không được để trống")] // Empty
        public async Task Register_InvalidPassword_ReturnsBadRequest(string password, string expectedError)
        {
            var emailTest = $"password_test_{Guid.NewGuid()}@example.com";
            try
            {
                // Arrange
                var formData = new Dictionary<string, string>
            {
                { "Username", "testuser_pwd" },
                { "PasswordHash", password },
                { "Email", emailTest },
                { "PhoneNumber", "0123456789" }
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                var errorMessage = await response.Content.ReadAsStringAsync();
                errorMessage.Should().Contain(expectedError);
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

        [Fact]
        public async Task Register_PasswordOver100Chars_ReturnsBadRequest()
        {
            var emailTest = "long_password@example.com";
            try
            {
                // Arrange - Password with 101 characters
                var longPassword = new string('a', 101);
                var formData = new Dictionary<string, string>
            {
                { "Username", "testuser_longpwd" },
                { "PasswordHash", longPassword },
                { "Email", emailTest },
                { "PhoneNumber", "0123456789" }
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                var errorMessage = await response.Content.ReadAsStringAsync();
                errorMessage.Should().Contain("Mật khẩu phải có ít nhất 6 ký tự");
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

        #endregion

        #region Email Validation Tests

       
        #endregion

        #region Phone Number Validation Tests

        [Fact]
        public async Task Register_NullPhoneNumber_Success()
        {
            var emailTest = "null_phone@example.com";
            try
            {
                // Arrange - PhoneNumber is optional
                var formData = new Dictionary<string, string>
            {
                { "Username", "user_no_phone" },
                { "PasswordHash", "Test@123" },
                { "Email", emailTest }
                // No PhoneNumber
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.OK);
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

        #endregion

        #region Display Name Validation Tests

        [Fact]
        public async Task Register_DisplayNameOver50Chars_ReturnsBadRequest()
        {
            var emailTest = "long_displayname@example.com";
            try
            {
                // Arrange - DisplayName with 51 characters
                var longDisplayName = new string('A', 51);
                var formData = new Dictionary<string, string>
            {
                { "Username", "testuser_longname" },
                { "PasswordHash", "Test@123" },
                { "Email", emailTest },
                { "PhoneNumber", "0123456789" },
                { "DisplayName", longDisplayName }
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                var errorMessage = await response.Content.ReadAsStringAsync();
                errorMessage.Should().Contain("Tên hiển thị không được dài quá 50 ký tự");
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

        [Fact]
        public async Task Register_NullDisplayName_Success()
        {
            var emailTest = "null_displayname@example.com";
            try
            {
                // Arrange - DisplayName is optional
                var formData = new Dictionary<string, string>
            {
                { "Username", "user_no_display" },
                { "PasswordHash", "Test@123" },
                { "Email", emailTest },
                { "PhoneNumber", "0123456789" }
                // No DisplayName
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.OK);
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

        #endregion

        #region Date of Birth Validation Tests

        [Fact]
        public async Task Register_FutureDob_ReturnsBadRequest()
        {
            var emailTest = "future_dob@example.com";
            try
            {
                // Arrange
                var futureDate = DateTime.Now.AddDays(1).ToString("yyyy-MM-dd");
                var formData = new Dictionary<string, string>
            {
                { "Username", "user_future_dob" },
                { "PasswordHash", "Test@123" },
                { "Email", emailTest },
                { "PhoneNumber", "0123456789" },
                { "Dob", futureDate }
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                var errorMessage = await response.Content.ReadAsStringAsync();
                errorMessage.Should().Contain("Ngày sinh không thể ở tương lai");
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

        [Fact]
        public async Task Register_DobOver120YearsAgo_ReturnsBadRequest()
        {
            var emailTest = "old_dob@example.com";
            try
            {
                // Arrange
                var veryOldDate = DateTime.Now.AddYears(-121).ToString("yyyy-MM-dd");
                var formData = new Dictionary<string, string>
            {
                { "Username", "user_old_dob" },
                { "PasswordHash", "Test@123" },
                { "Email", emailTest },
                { "PhoneNumber", "0123456789" },
                { "Dob", veryOldDate }
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                var errorMessage = await response.Content.ReadAsStringAsync();
                errorMessage.Should().Contain("Ngày sinh không hợp lệ");
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

        [Fact]
        public async Task Register_ValidDob_Success()
        {
            var emailTest = "valid_dob@example.com";
            try
            {
                // Arrange
                var validDate = DateTime.Now.AddYears(-25).ToString("yyyy-MM-dd");
                var formData = new Dictionary<string, string>
            {
                { "Username", "user_valid_dob" },
                { "PasswordHash", "Test@123" },
                { "Email", emailTest },
                { "PhoneNumber", "0123456789" },
                { "Dob", validDate }
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.OK);
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

        [Fact]
        public async Task Register_NullDob_Success()
        {
            var emailTest = "null_dob@example.com";
            try
            {
                // Arrange - Dob is optional
                var formData = new Dictionary<string, string>
            {
                { "Username", "user_no_dob" },
                { "PasswordHash", "Test@123" },
                { "Email", emailTest },
                { "PhoneNumber", "0123456789" }
                // No Dob
            };
                var content = new FormUrlEncodedContent(formData);

                // Act
                var response = await _client.PostAsync("/register", content);

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.OK);
            }
            finally
            {
                await CleanupUser(emailTest);
            }
        }

        #endregion

        [Fact(DisplayName = "UserFlow: ForgotPassword_Then_ResetPassword_Success")]
        public async Task ForgotPassword_Then_ResetPassword_Success()
        {
            // Step 1: Lấy thông tin một user có sẵn trong hệ thống
            var user = await _db.Users
                .Where(u => u.IsActive && u.Email.Equals("blabla180202@gmail.com"))
                .FirstOrDefaultAsync();

            user.Should().NotBeNull("Cần có ít nhất một user tồn tại trong hệ thống để test");
            var email = user!.Email;

            try
            {
                // Step 2: Gửi yêu cầu quên mật khẩu
                var forgotResponse = await _client.PostAsJsonAsync("/forgot-password", email);
                forgotResponse.StatusCode.Should().Be(HttpStatusCode.OK);

                var forgotMsg = await forgotResponse.Content.ReadAsStringAsync();
                forgotMsg.Should().Contain("OTP đã được gửi tới email của bạn.");

                // Step 3: Lấy OTP từ DB
                var otpRecord = await _db.UserOtps
                    .Where(x => x.Email == email && !x.IsUsed)
                    .OrderByDescending(x => x.CreatedAt)
                    .FirstOrDefaultAsync();

                otpRecord.Should().NotBeNull("OTP phải tồn tại sau khi gọi forgot-password");
                var otpCode = otpRecord!.OtpCode;

                // Step 4: Reset password bằng OTP đó
                var resetRequest = new RequestDTOResetPassword
                {
                    Email = email,
                    OtpCode = otpCode,
                    NewPassword = "NewPassword123!"
                };

                var resetResponse = await _client.PostAsJsonAsync("/reset-password", resetRequest);
                resetResponse.StatusCode.Should().Be(HttpStatusCode.OK);

                var resetMsg = await resetResponse.Content.ReadAsStringAsync();
                resetMsg.Should().Contain("Mật khẩu đã được đặt lại thành công");

                // Sau khi doi mk chay lai login 
                // Arrange
                var formData = new Dictionary<string, string>
                    {
                        { "Username", $"{user.Username}" },
                        { "Password", "NewPassword123!" }
                    };
                var loginRequest = new FormUrlEncodedContent(formData);
                // Act
                var response = await _client.PostAsync("/login", loginRequest);
                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.OK);
            }
            finally
            {
                // Cleanup: Xóa OTP test để không ảnh hưởng lần test sau
                var testOtps = _db.UserOtps.Where(o => o.Email == email);
                _db.UserOtps.RemoveRange(testOtps);
                await _db.SaveChangesAsync();
            }
        }
        private async Task CleanupUser(string email)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user != null)
            {
                _db.Users.Remove(user);
                await _db.SaveChangesAsync();
            }

            var otps = _db.UserOtps.Where(o => o.Email == email);
            _db.UserOtps.RemoveRange(otps);
            await _db.SaveChangesAsync();
        }

    }
}
