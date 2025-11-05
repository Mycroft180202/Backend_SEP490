using Backend_SEP490.Controllers;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Net.WebSockets;

namespace Backend_SEP490.UnitTests
{
    public class AuthControllerUnitTest
    {
        private readonly Mock<IUserServices> _userServiceMock;
        private readonly AuthController _controller;

        public AuthControllerUnitTest()
        {
            _userServiceMock = new Mock<IUserServices>();
            _controller = new AuthController(_userServiceMock.Object);
        }

        // -------------------------------
        // LOGIN TESTS (Full coverage)
        // -------------------------------
        [Fact(DisplayName = "Login - Normal Case - Valid credentials return OK")]
        public async Task Login_ValidCredentials_ReturnsOk()
        {
            // Arrange
            var request = new LoginRequest { Username = "hung", Password = "123456" };
            _userServiceMock
                .Setup(s => s.LoginAsync("hung", "123456"))
                .ReturnsAsync(new ResponseDTOAuth { AccessToken = "abc123", RefreshToken = "r1" });

            // Act
            var result = await _controller.Login(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<ResponseDTOAuth>(okResult.Value);
            Assert.Equal("abc123", response.AccessToken);
            _userServiceMock.Verify(s => s.LoginAsync("hung", "123456"), Times.Once);
        }

        // ABNORMAL CASES (Invalid data, missing data, wrong credentials)
        [Fact(DisplayName = "Login - Invalid credentials return Unauthorized")]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var request = new LoginRequest { Username = "wrong", Password = "wrong" };
            _userServiceMock
                .Setup(s => s.LoginAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((ResponseDTOAuth?)null);

            // Act
            var result = await _controller.Login(request);

            // Assert
            var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Invalid username or password", unauthorized.Value);
        }

        [Fact(DisplayName = "Login - Missing username should return BadRequest")]
        public async Task Login_MissingUsername_ReturnsBadRequest()
        {
            var request = new LoginRequest { Username = "", Password = "123456" };
            _controller.ModelState.AddModelError("Username", "Tên đăng nhập không được để trống");

            var result = await _controller.Login(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var error = ((SerializableError)badRequest.Value)["Username"] as string[];
            var message = error[0];
            Assert.Equal("Tên đăng nhập không được để trống", message);
        }


        [Fact(DisplayName = "Login - Missing password should return BadRequest")]
        public async Task Login_MissingPassword_ReturnsBadRequest()
        {
            var request = new LoginRequest { Username = "hung", Password = "" };
            _controller.ModelState.AddModelError("Password", "Mật khẩu không được để trống");

            var result = await _controller.Login(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var error = ((SerializableError)badRequest.Value)["Password"] as string[];
            var message = error[0];
            Assert.Equal("Mật khẩu không được để trống", message);
        }

        //  BOUNDARY CASES (biên độ dữ liệu)
        [Fact(DisplayName = "Login - Username min length (3 chars) is accepted")]
        public async Task Login_UsernameMinLength_ReturnsOk()
        {
            var request = new LoginRequest { Username = "abc", Password = "123456" };
            _userServiceMock
                .Setup(s => s.LoginAsync("abc", "123456"))
                .ReturnsAsync(new ResponseDTOAuth { AccessToken = "t1", RefreshToken = "r1" });

            var result = await _controller.Login(request);
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact(DisplayName = "Login - Username below min length (2 chars) returns BadRequest")]
        public async Task Login_UsernameTooShort_ReturnsBadRequest()
        {
            var request = new LoginRequest { Username = "ab", Password = "123456" };
            _controller.ModelState.AddModelError("Username", "Tên đăng nhập phải từ 3–30 ký tự");

            var result = await _controller.Login(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Tên đăng nhập phải từ 3–30 ký tự", ((SerializableError)badRequest.Value)["Username"] as string[]);
        }

        [Fact(DisplayName = "Login - Password min length (6 chars) is accepted")]
        public async Task Login_PasswordMinLength_ReturnsOk()
        {
            var request = new LoginRequest { Username = "hung", Password = "123456" };
            _userServiceMock
                .Setup(s => s.LoginAsync("hung", "123456"))
                .ReturnsAsync(new ResponseDTOAuth { AccessToken = "abc123", RefreshToken = "r1" });

            var result = await _controller.Login(request);
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact(DisplayName = "Login - Password below min length (5 chars) returns BadRequest")]
        public async Task Login_PasswordTooShort_ReturnsBadRequest()
        {
            var request = new LoginRequest { Username = "hung", Password = "12345" };
            _controller.ModelState.AddModelError("Password", "Mật khẩu phải từ 6–100 ký tự");

            var result = await _controller.Login(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Mật khẩu phải từ 6–100 ký tự", ((SerializableError)badRequest.Value)["Password"] as string[]);
        }


        // -------------------------------
        // REFRESH TOKEN TESTS
        // -------------------------------
        [Fact]
        public async Task Refresh_ValidToken_ReturnsOk()
        {
            var dto = new RequestDTORefresh { RefreshToken = "validtoken" };
            _userServiceMock
                .Setup(s => s.RefreshTokenAsync("validtoken"))
                .ReturnsAsync(new ResponseDTOAuth { AccessToken = "newtoken", RefreshToken = "ref123" });

            var result = await _controller.Refresh(dto);

            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<ResponseDTOAuth>(ok.Value);
            Assert.Equal("newtoken", response.AccessToken);
        }

        [Fact]
        public async Task Refresh_InvalidToken_ReturnsUnauthorized()
        {
            var dto = new RequestDTORefresh { RefreshToken = "invalid" };
            _userServiceMock
                .Setup(s => s.RefreshTokenAsync("invalid"))
                .ReturnsAsync((ResponseDTOAuth?)null);

            var result = await _controller.Refresh(dto);

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        // -------------------------------
        // REGISTER TESTS (Full coverage)
        // -------------------------------

        [Fact(DisplayName = "Register - Normal case - Success returns OK")]
        public async Task Register_Success_ReturnsOk()
        {
            // Arrange
            var dto = new RequestDTORegister
            {
                Username = "testuser",
                Email = "test@gmail.com",
                PasswordHash = "123456",
                PhoneNumber = "0912345678",
                DisplayName = "Hung",
                Dob = new DateTime(2000, 1, 1)
            };

            _userServiceMock.Setup(s => s.RegisterAsync(dto)).ReturnsAsync(true);

            // Act
            var result = await _controller.Register(dto);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("OTP sent to email", ok.Value);
            _userServiceMock.Verify(s => s.RegisterAsync(dto), Times.Once);
        }

        [Fact(DisplayName = "Register - Abnormal - Username already exists returns BadRequest")]
        public async Task Register_UsernameExists_ReturnsBadRequest()
        {
            var dto = new RequestDTORegister
            {
                Username = "duplicate",
                Email = "dup@gmail.com",
                PasswordHash = "123456"
            };

            _userServiceMock.Setup(s => s.RegisterAsync(dto)).ReturnsAsync(false);

            var result = await _controller.Register(dto);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ABNORMAL CASES (Invalid input)

        [Fact(DisplayName = "Register - Missing username returns BadRequest")]
        public async Task Register_MissingUsername_ReturnsBadRequest()
        {
            var dto = new RequestDTORegister
            {
                Username = "",
                Email = "test@gmail.com",
                PasswordHash = "123456"
            };
            _controller.ModelState.AddModelError("Username", "Tên đăng nhập không được để trống");

            var result = await _controller.Register(dto);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Tên đăng nhập không được để trống", ((SerializableError)bad.Value)["Username"] as string[]);
        }

        [Fact(DisplayName = "Register - Missing email returns BadRequest")]
        public async Task Register_MissingEmail_ReturnsBadRequest()
        {
            var dto = new RequestDTORegister
            {
                Username = "hung",
                Email = "",
                PasswordHash = "123456"
            };
            _controller.ModelState.AddModelError("Email", "Email không được để trống");

            var result = await _controller.Register(dto);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Email không được để trống", ((SerializableError)bad.Value)["Email"] as string[]);
        }

        [Fact(DisplayName = "Register - Invalid email format returns BadRequest")]
        public async Task Register_InvalidEmailFormat_ReturnsBadRequest()
        {
            var dto = new RequestDTORegister
            {
                Username = "hung",
                Email = "invalid-email",
                PasswordHash = "123456"
            };
            _controller.ModelState.AddModelError("Email", "Email không hợp lệ");

            var result = await _controller.Register(dto);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Email không hợp lệ", ((SerializableError)bad.Value)["Email"] as string[]);
        }

        [Fact(DisplayName = "Register - Password too short returns BadRequest")]
        public async Task Register_PasswordTooShort_ReturnsBadRequest()
        {
            var dto = new RequestDTORegister
            {
                Username = "hung",
                Email = "mail@gmail.com",
                PasswordHash = "12345"
            };
            _controller.ModelState.AddModelError("PasswordHash", "Mật khẩu phải có ít nhất 6 ký tự");

            var result = await _controller.Register(dto);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Mật khẩu phải có ít nhất 6 ký tự", ((SerializableError)bad.Value)["PasswordHash"] as string[]);
        }

        [Fact(DisplayName = "Register - Invalid phone number returns BadRequest")]
        public async Task Register_InvalidPhoneNumber_ReturnsBadRequest()
        {
            var dto = new RequestDTORegister
            {
                Username = "hung",
                Email = "mail@gmail.com",
                PasswordHash = "123456",
                PhoneNumber = "abcd"
            };
            _controller.ModelState.AddModelError("PhoneNumber", "Số điện thoại không hợp lệ");

            var result = await _controller.Register(dto);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Số điện thoại không hợp lệ", ((SerializableError)bad.Value)["PhoneNumber"] as string[]);
        }

        //  BOUNDARY CASES (giá trị giới hạn)

        [Fact(DisplayName = "Register - Username at minimum length (3) returns OK")]
        public async Task Register_UsernameMinLength_ReturnsOk()
        {
            var dto = new RequestDTORegister
            {
                Username = "abc",
                Email = "ok@gmail.com",
                PasswordHash = "123456"
            };
            _userServiceMock.Setup(s => s.RegisterAsync(dto)).ReturnsAsync(true);

            var result = await _controller.Register(dto);
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact(DisplayName = "Register - Username below minimum length (2) returns BadRequest")]
        public async Task Register_UsernameTooShort_ReturnsBadRequest()
        {
            var dto = new RequestDTORegister
            {
                Username = "ab",
                Email = "ok@gmail.com",
                PasswordHash = "123456"
            };
            _controller.ModelState.AddModelError("Username", "Tên đăng nhập phải từ 3–30 ký tự");

            var result = await _controller.Register(dto);
            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Tên đăng nhập phải từ 3–30 ký tự", ((SerializableError)bad.Value)["Username"] as string[]);
        }

        [Fact(DisplayName = "Register - Dob in the future returns BadRequest")]
        public async Task Register_DobInFuture_ReturnsBadRequest()
        {
            var dto = new RequestDTORegister
            {
                Username = "hung",
                Email = "mail@gmail.com",
                PasswordHash = "123456",
                Dob = DateTime.Now.AddDays(1)
            };
            _controller.ModelState.AddModelError("Dob", "Ngày sinh không thể ở tương lai");

            var result = await _controller.Register(dto);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Ngày sinh không thể ở tương lai", ((SerializableError)bad.Value)["Dob"] as string[]);
        }

        [Fact(DisplayName = "Register - Dob over 120 years ago returns BadRequest")]
        public async Task Register_DobTooOld_ReturnsBadRequest()
        {
            var dto = new RequestDTORegister
            {
                Username = "hung",
                Email = "mail@gmail.com",
                PasswordHash = "123456",
                Dob = DateTime.Now.AddYears(-121)
            };
            _controller.ModelState.AddModelError("Dob", "Ngày sinh không hợp lệ");

            var result = await _controller.Register(dto);

            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Ngày sinh không hợp lệ", ((SerializableError)bad.Value)["Dob"] as string[]);
        }


        // -------------------------------
        // VERIFY OTP
        // -------------------------------
        [Fact]
        public async Task VerifyOtp_ValidOtp_ReturnsOk()
        {
            var request = new RequestDTOVerifyOtp
            {
                RegisterDto = new RequestDTORegister(),
                Otp = "1234"
            };
            _userServiceMock.Setup(s => s.VerifyOtpAsync(request.RegisterDto, "1234"))
                .ReturnsAsync(true);

            var result = await _controller.VerifyOtp(request);
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Registration successful", ok.Value);
        }

        [Fact]
        public async Task VerifyOtp_InvalidOtp_ReturnsBadRequest()
        {
            var request = new RequestDTOVerifyOtp
            {
                RegisterDto = new RequestDTORegister(),
                Otp = "9999"
            };
            _userServiceMock.Setup(s => s.VerifyOtpAsync(request.RegisterDto, "9999"))
                .ReturnsAsync(false);

            var result = await _controller.VerifyOtp(request);
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // -------------------------------
        // FORGOT PASSWORD
        // -------------------------------
        [Fact]
        public async Task ForgotPassword_EmailExists_ReturnsOk()
        {
            _userServiceMock.Setup(s => s.ForgotPasswordAsync("mail@gmail.com"))
                .ReturnsAsync(true);

            var result = await _controller.ForgotPassword("mail@gmail.com");
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("OTP đã được gửi tới email của bạn.", ok.Value);
        }

        [Fact]
        public async Task ForgotPassword_EmailNotFound_ReturnsBadRequest()
        {
            _userServiceMock.Setup(s => s.ForgotPasswordAsync(It.IsAny<string>()))
                .ReturnsAsync(false);

            var result = await _controller.ForgotPassword("none@gmail.com");
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // -------------------------------
        // RESET PASSWORD
        // -------------------------------
        [Fact]
        public async Task ResetPassword_Success_ReturnsOk()
        {
            var dto = new RequestDTOResetPassword { Email = "mail@gmail.com", OtpCode = "1111", NewPassword = "newpass" };
            _userServiceMock.Setup(s => s.ResetPasswordAsync(dto))
                .ReturnsAsync(true);

            var result = await _controller.ResetPassword(dto);
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("Mật khẩu đã được đặt lại thành công.", ok.Value);
        }

        [Fact]
        public async Task ResetPassword_InvalidOtp_ReturnsBadRequest()
        {
            var dto = new RequestDTOResetPassword { Email = "mail@gmail.com", OtpCode = "wrong", NewPassword = "newpass" };
            _userServiceMock.Setup(s => s.ResetPasswordAsync(dto))
                .ReturnsAsync(false);

            var result = await _controller.ResetPassword(dto);
            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
