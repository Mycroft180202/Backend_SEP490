using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using CloudinaryDotNet;
using Moq;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.UnitTests
{
    public class AuthUserUnitTests
    {
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<Cloudinary> _cloudinaryMock;
        private readonly UserServicesImpl _service;

        public AuthUserUnitTests()
        {
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _emailServiceMock = new Mock<IEmailService>();
            _cloudinaryMock = new Mock<Cloudinary>(new Account());

            Environment.SetEnvironmentVariable("JWT_KEY", "supersecretkey12345678901234567890abcd");
            Environment.SetEnvironmentVariable("JWT_ISSUER", "testIssuer");
            Environment.SetEnvironmentVariable("JWT_AUDIENCE", "testAudience");
            Environment.SetEnvironmentVariable("JWT_EXPIRE_MINUTES", "15");
            Environment.SetEnvironmentVariable("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7");

            _service = new UserServicesImpl(
                _mapperMock.Object,
                _unitOfWorkMock.Object,
                _emailServiceMock.Object,
                _cloudinaryMock.Object);
        }
        // -------------------------------
        // LOGIN TESTS
        // -------------------------------
        [Fact(DisplayName = "LoginAsync - Valid credentials returns tokens")]
        public async Task LoginAsync_ValidCredentials_ReturnsTokens()
        {
            // Arrange
            var userRepo = new Mock<IUserRepositories>();
            var refreshRepo = new Mock<IRefreshTokenRepository>();

            var user = new User
            {
                UserID = "U1",
                Username = "khanh",
                PasswordHash = Convert.ToBase64String(System.Security.Cryptography.SHA256.Create().ComputeHash(System.Text.Encoding.UTF8.GetBytes("123456"))),
                UserRoles = new List<UserRole>()
            };

            userRepo.Setup(r => r.GetUserByUsernameAsync("khanh")).ReturnsAsync(user);
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);

            // Act
            var result = await _service.LoginAsync("khanh", "123456");

            // Assert
            Assert.NotNull(result);
            Assert.NotEmpty(result.AccessToken);
            Assert.NotEmpty(result.RefreshToken);
        }

        [Fact(DisplayName = "LoginAsync - Invalid password returns null")]
        public async Task LoginAsync_InvalidPassword_ReturnsNull()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            userRepo.Setup(r => r.GetUserByUsernameAsync("khanh")).ReturnsAsync(new User
            {
                Username = "khanh",
                PasswordHash = "wrongHash"
            });

            var result = await _service.LoginAsync("khanh", "wrong");

            Assert.Null(result);
        }

        [Fact(DisplayName = "LoginAsync - User not found returns null")]
        public async Task LoginAsync_UserNotFound_ReturnsNull()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            userRepo.Setup(r => r.GetUserByUsernameAsync("khanh")).ReturnsAsync((User?)null);

            var result = await _service.LoginAsync("khanh", "123456");

            Assert.Null(result);
        }
        // -------------------------------
        // LOGIN VALIDATION TESTS (Throw exception) 
        // -------------------------------

        [Fact(DisplayName = "LoginAsync - Empty username throws ArgumentException")]
        public async Task LoginAsync_EmptyUsername_ThrowsArgumentException()
        {
            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.LoginAsync("", "123456"));
            Assert.Equal("Tên đăng nhập không được để trống", ex.Message);
        }

        [Fact(DisplayName = "LoginAsync - Empty password throws ArgumentException")]
        public async Task LoginAsync_EmptyPassword_ThrowsArgumentException()
        {
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.LoginAsync("khanh", ""));
            Assert.Equal("Mật khẩu không được để trống", ex.Message);
        }

        [Fact(DisplayName = "LoginAsync - Username less than 3 or greater than 30 characters throws ArgumentException")]
        public async Task LoginAsync_InvalidUsernameLength_ThrowsArgumentException()
        {
            var tooShort = "ab";
            var tooLong = new string('a', 31);

            var exShort = await Assert.ThrowsAsync<ArgumentException>(() => _service.LoginAsync(tooShort, "123456"));
            var exLong = await Assert.ThrowsAsync<ArgumentException>(() => _service.LoginAsync(tooLong, "123456"));

            Assert.Equal("Tên đăng nhập phải từ 3–30 ký tự", exShort.Message);
            Assert.Equal("Tên đăng nhập phải từ 3–30 ký tự", exLong.Message);
        }

        [Fact(DisplayName = "LoginAsync - Password less than 6 or greater than 100 characters throws ArgumentException")]
        public async Task LoginAsync_InvalidPasswordLength_ThrowsArgumentException()
        {
            var tooShort = "12345";
            var tooLong = new string('a', 101);

            var exShort = await Assert.ThrowsAsync<ArgumentException>(() => _service.LoginAsync("khanh", tooShort));
            var exLong = await Assert.ThrowsAsync<ArgumentException>(() => _service.LoginAsync("khanh", tooLong));

            Assert.Equal("Mật khẩu phải từ 6–100 ký tự", exShort.Message);
            Assert.Equal("Mật khẩu phải từ 6–100 ký tự", exLong.Message);
        }




        // -------------------------------
        // REGISTER TESTS
        // -------------------------------
        [Fact(DisplayName = "RegisterAsync - Success sends OTP and returns true")]
        public async Task RegisterAsync_Success_ReturnsTrue()
        {
            var userRepo = new Mock<IUserRepositories>();
            var otpRepo = new Mock<IUserOtpRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);

            userRepo.Setup(r => r.GetUserByUsernameAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
            userRepo.Setup(r => r.GetUserByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

            var dto = new RequestDTORegister
            {
                Username = "khanh",
                Email = "khanh@gmail.com",
                PasswordHash = "123456",
                PhoneNumber = "0900000000",
                DisplayName = "Khanh"
            };

            var result = await _service.RegisterAsync(dto);

            Assert.True(result);
            _emailServiceMock.Verify(e => e.SendEmailAsync(dto.Email, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Fact(DisplayName = "RegisterAsync - Duplicate username returns false")]
        public async Task RegisterAsync_DuplicateUsername_ReturnsFalse()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            userRepo.Setup(r => r.GetUserByUsernameAsync("khanh")).ReturnsAsync(new User());

            var dto = new RequestDTORegister
            {
                Username = "khanh",
                Email = "khanh@gmail.com",
                PasswordHash = "123456"
            };

            var result = await _service.RegisterAsync(dto);
            Assert.False(result);
        }

        [Theory(DisplayName = "RegisterAsync - Invalid model validation returns false")]
        [InlineData("", "123456", "user@gmail.com", "0900000000", "Khanh", "Tên đăng nhập không được để trống")]                  // Username rỗng
        [InlineData("ab", "123456", "user@gmail.com", "0900000000", "Khanh", "Tên đăng nhập phải từ 3–30 ký tự")]               // Username quá ngắn
        [InlineData("a1234567890123456789012345678901", "123456", "user@gmail.com", "0900000000", "Khanh", "Tên đăng nhập phải từ 3–30 ký tự")] // Username quá dài
        [InlineData("khanh", "", "user@gmail.com", "0900000000", "Khanh", "Mật khẩu không được để trống")]                       // Password rỗng
        [InlineData("khanh", "123", "user@gmail.com", "0900000000", "Khanh", "Mật khẩu phải có ít nhất 6 ký tự")]               // Password quá ngắn
        [InlineData("khanh", "123456", "", "0900000000", "Khanh", "Email không được để trống")]                                 // Email rỗng
        [InlineData("khanh", "123456", "invalidemail", "0900000000", "Khanh", "Email không hợp lệ")]                             // Email sai định dạng
        [InlineData("khanh", "123456", "user@gmail.com", "abc", "Khanh", "Số điện thoại không hợp lệ")]                         // Số điện thoại sai định dạng
        [InlineData("khanh", "123456", "user@gmail.com", "0900000000000000", "Khanh", "Số điện thoại không được dài quá 15 ký tự")] // SĐT quá dài
        [InlineData("khanh", "123456", "user@gmail.com", "0900000000", "Tên hiển thị quá dài xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "Tên hiển thị không được dài quá 50 ký tự")] // DisplayName quá dài
        public void RegisterAsync_ModelValidation_ReturnsFalse(
            string username, string password, string email, string phone, string display, string expectedMessage)
        {
            // Arrange
            var dto = new RequestDTORegister
            {
                Username = username,
                PasswordHash = password,
                Email = email,
                PhoneNumber = phone,
                DisplayName = display
            };

            var validationContext = new ValidationContext(dto);
            var validationResults = new List<ValidationResult>();

            // Act
            var isValid = Validator.TryValidateObject(dto, validationContext, validationResults, true);

            // Assert
            Assert.False(isValid);
            Assert.Contains(validationResults, v => v.ErrorMessage == expectedMessage);
        }

        [Fact(DisplayName = "RegisterAsync - Invalid DOB in the future fails validation")]
        public void RegisterAsync_DobInFuture_ReturnsFalse()
        {
            var dto = new RequestDTORegister
            {
                Username = "khanh",
                PasswordHash = "123456",
                Email = "khanh@gmail.com",
                Dob = DateTime.Now.AddDays(1) // Tương lai
            };

            var context = new ValidationContext(dto);
            var results = new List<ValidationResult>();
            var valid = Validator.TryValidateObject(dto, context, results, true);

            Assert.False(valid);
            Assert.Contains(results, r => r.ErrorMessage == "Ngày sinh không thể ở tương lai");
        }

        [Fact(DisplayName = "RegisterAsync - Invalid DOB too old fails validation")]
        public void RegisterAsync_DobTooOld_ReturnsFalse()
        {
            var dto = new RequestDTORegister
            {
                Username = "khanh",
                PasswordHash = "123456",
                Email = "khanh@gmail.com",
                Dob = DateTime.Now.AddYears(-130)
            };

            var context = new ValidationContext(dto);
            var results = new List<ValidationResult>();
            var valid = Validator.TryValidateObject(dto, context, results, true);

            Assert.False(valid);
            Assert.Contains(results, r => r.ErrorMessage == "Ngày sinh không hợp lệ");
        }

        [Fact(DisplayName = "RegisterAsync - Valid DOB passes validation")]
        public void RegisterAsync_ValidDob_ReturnsTrue()
        {
            var dto = new RequestDTORegister
            {
                Username = "khanh",
                PasswordHash = "123456",
                Email = "khanh@gmail.com",
                Dob = DateTime.Now.AddYears(-20)
            };

            var context = new ValidationContext(dto);
            var results = new List<ValidationResult>();
            var valid = Validator.TryValidateObject(dto, context, results, true);

            Assert.True(valid);
        }


        // -------------------------------
        // VERIFY OTP TESTS
        // -------------------------------
        [Fact(DisplayName = "VerifyOtpAsync - Valid OTP returns true")]
        public async Task VerifyOtpAsync_ValidOtp_ReturnsTrue()
        {
            var otpRepo = new Mock<IUserOtpRepositories>();
            var userRepo = new Mock<IUserRepositories>();
            var roleRepo = new Mock<IRoleRepository>();
            var userRoleRepo = new Mock<IUserRoleRepository>();

            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            _unitOfWorkMock.Setup(u => u.Roles).Returns(roleRepo.Object);
            _unitOfWorkMock.Setup(u => u.UserRoles).Returns(userRoleRepo.Object);

            otpRepo.Setup(r => r.GetValidOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new UserOtp { Email = "mail@gmail.com", OtpCode = "123456" });

            roleRepo.Setup(r => r.GetByNameAsync("Customer")).ReturnsAsync(new Role { Id = "R1", Name = "Customer" });

            var dto = new RequestDTORegister { Username = "khanh", PasswordHash = "123456", Email = "mail@gmail.com" };

            var result = await _service.VerifyOtpAsync(dto, "123456");

            Assert.True(result);
        }

        [Fact(DisplayName = "VerifyOtpAsync - Invalid OTP returns false")]
        public async Task VerifyOtpAsync_InvalidOtp_ReturnsFalse()
        {
            var otpRepo = new Mock<IUserOtpRepositories>();
            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);
            otpRepo.Setup(r => r.GetValidOtpAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync((UserOtp?)null);

            var dto = new RequestDTORegister { Username = "khanh", PasswordHash = "123456", Email = "mail@gmail.com" };
            var result = await _service.VerifyOtpAsync(dto, "0000");
            Assert.False(result);
        }
        [Fact(DisplayName = "VerifyOtpAsync - Expired OTP returns false")]
        public async Task VerifyOtpAsync_ExpiredOtp_ReturnsFalse()
        {
            var otpRepo = new Mock<IUserOtpRepositories>();
            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);

            otpRepo.Setup(r => r.GetValidOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
                   .ReturnsAsync(new UserOtp
                   {
                       Email = "mail@gmail.com",
                       OtpCode = "12345",
                       ExpiresAt = DateTime.UtcNow.AddDays(-10) // OTP đã hết hạn
                   });

            var dto = new RequestDTORegister { Username = "khanh", PasswordHash = "12345", Email = "mail@gmail.com" };
            var result = await _service.VerifyOtpAsync(dto, "12345");

            Assert.False(result);
        }

        // -------------------------------
        // RESET PASSWORD
        // -------------------------------
        [Fact(DisplayName = "ResetPasswordAsync - Valid OTP resets successfully")]
        public async Task ResetPasswordAsync_ValidOtp_ReturnsTrue()
        {
            var userRepo = new Mock<IUserRepositories>();
            var otpRepo = new Mock<IUserOtpRepositories>();

            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);

            userRepo.Setup(r => r.GetUserByEmailAsync("mail@gmail.com")).ReturnsAsync(new User { Email = "mail@gmail.com" });
            otpRepo.Setup(r => r.GetLatestOtpByEmailAsync("mail@gmail.com")).ReturnsAsync(new UserOtp
            {
                Email = "mail@gmail.com",
                OtpCode = "1111",
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            });

            var dto = new RequestDTOResetPassword
            {
                Email = "mail@gmail.com",
                OtpCode = "1111",
                NewPassword = "newpass"
            };

            var result = await _service.ResetPasswordAsync(dto);
            Assert.True(result);
        }

        [Fact(DisplayName = "ResetPasswordAsync - Invalid OTP returns false")]
        public async Task ResetPasswordAsync_InvalidOtp_ReturnsFalse()
        {
            var userRepo = new Mock<IUserRepositories>();
            var otpRepo = new Mock<IUserOtpRepositories>();

            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);

            userRepo.Setup(r => r.GetUserByEmailAsync("mail@gmail.com")).ReturnsAsync(new User { Email = "mail@gmail.com" });
            otpRepo.Setup(r => r.GetLatestOtpByEmailAsync("mail@gmail.com")).ReturnsAsync(new UserOtp
            {
                Email = "mail@gmail.com",
                OtpCode = "0000", // khác với dto
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            });

            var dto = new RequestDTOResetPassword
            {
                Email = "mail@gmail.com",
                OtpCode = "wrong",
                NewPassword = "newpass"
            };

            var result = await _service.ResetPasswordAsync(dto);
            Assert.False(result);
        }
        [Fact(DisplayName = "ResetPasswordAsync - Expired OTP returns false")]
        public async Task ResetPasswordAsync_ExpiredOtp_ReturnsFalse()
        {
            var userRepo = new Mock<IUserRepositories>();
            var otpRepo = new Mock<IUserOtpRepositories>();

            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);

            userRepo.Setup(r => r.GetUserByEmailAsync("mail@gmail.com")).ReturnsAsync(new User { Email = "mail@gmail.com" });
            otpRepo.Setup(r => r.GetLatestOtpByEmailAsync("mail@gmail.com")).ReturnsAsync(new UserOtp
            {
                Email = "mail@gmail.com",
                OtpCode = "1111",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1), // đã hết hạn
                IsUsed = false
            });

            var dto = new RequestDTOResetPassword
            {
                Email = "mail@gmail.com",
                OtpCode = "1111",
                NewPassword = "NewPass@123"
            };

            var result = await _service.ResetPasswordAsync(dto);
            Assert.False(result);
        }
        [Fact(DisplayName = "ResetPasswordAsync - Used OTP returns false")]
        public async Task ResetPasswordAsync_UsedOtp_ReturnsFalse()
        {
            var userRepo = new Mock<IUserRepositories>();
            var otpRepo = new Mock<IUserOtpRepositories>();

            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);

            userRepo.Setup(r => r.GetUserByEmailAsync("mail@gmail.com")).ReturnsAsync(new User { Email = "mail@gmail.com" });
            otpRepo.Setup(r => r.GetLatestOtpByEmailAsync("mail@gmail.com")).ReturnsAsync(new UserOtp
            {
                Email = "mail@gmail.com",
                OtpCode = "1111",
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                IsUsed = true // đã dùng
            });

            var dto = new RequestDTOResetPassword
            {
                Email = "mail@gmail.com",
                OtpCode = "1111",
                NewPassword = "NewPass@123"
            };

            var result = await _service.ResetPasswordAsync(dto);
            Assert.False(result);
        }
        [Fact(DisplayName = "ResetPasswordAsync - User not found returns false")]
        public async Task ResetPasswordAsync_UserNotFound_ReturnsFalse()
        {
            var userRepo = new Mock<IUserRepositories>();
            var otpRepo = new Mock<IUserOtpRepositories>();

            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);

            userRepo.Setup(r => r.GetUserByEmailAsync("mail@gmail.com")).ReturnsAsync((User)null); // không có user
            otpRepo.Setup(r => r.GetLatestOtpByEmailAsync("mail@gmail.com")).ReturnsAsync((UserOtp)null);

            var dto = new RequestDTOResetPassword
            {
                Email = "mail@gmail.com",
                OtpCode = "1111",
                NewPassword = "NewPass@123"
            };

            var result = await _service.ResetPasswordAsync(dto);
            Assert.False(result);
        }
        [Theory(DisplayName = "RequestDTOResetPassword - Invalid data fails validation")]
        [InlineData("", "111111", "Aa@12345", "Email không được để trống")]
        [InlineData("invalidemail", "111111", "Aa@12345", "Email không hợp lệ")]
        [InlineData("mail@gmail.com", "123", "Aa@12345", "Mã OTP phải gồm đúng 6 ký tự")]
        [InlineData("mail@gmail.com", "111111", "abc", "Mật khẩu mới phải từ 8–100 ký tự")]
        [InlineData("mail@gmail.com", "111111", "abcABC123", "Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt")]
        public void RequestDTOResetPassword_InvalidData_ReturnsValidationError(
             string email, string otp, string password, string expectedError)
        {
            // Arrange
            var dto = new RequestDTOResetPassword
            {
                Email = email,
                OtpCode = otp,
                NewPassword = password
            };

            var results = new List<ValidationResult>();
            var context = new ValidationContext(dto);

            // Act
            bool isValid = Validator.TryValidateObject(dto, context, results, true);

            // Assert
            Assert.False(isValid);
            Assert.Contains(results, r => r.ErrorMessage.Contains(expectedError));
        }


        // UNIT TEST FOR USER MODULE 
        // GetAllUsersAsync
        //[Fact(DisplayName = "GetAllUsersAsync - Return valid users")]
        //public async Task GetAllUsersAsync_ReturnsValidPagedResult()
        //{
        //    // Arrange
        //    var userList = new List<User>
        //            {
        //                new() { UserID = "U1", Username = "Hung" },
        //                new() { UserID = "U2", Username = "Long" }
        //            };

        //    _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepoMock.Object);

        //    _userRepoMock.Setup(r => r.GetAllUsersAsync())
        //        .ReturnsAsync(userList);

        //    _userRepoMock.Setup(r => r.GetAllUsersWithRolesAsync(1, 10))
        //        .ReturnsAsync(userList);

        //    _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOUser>>(userList))
        //        .Returns(new List<ResponseDTOUser>
        //        {
        //    new() { UserID = "U1", Username = "Hung" },
        //    new() { UserID = "U2", Username = "Long" }
        //        });

        //    // Act
        //    var result = await _service.GetAllUsersAsync(new RequestFilterUser(), 1, 10);

        //    // Assert
        //    Assert.NotNull(result);
        //    Assert.Equal(2, result.Items.Count());
        //    Assert.Equal(2, result.TotalCount);
        //}

        //[Fact(DisplayName = "GetAllUsersAsync - No filter - Return all users")]
        //public async Task GetAllUsersAsync_NoFilter_ReturnsAllUsers()
        //{
        //    _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepoMock.Object);

        //    var users = new List<User>
        //        {
        //            new() { UserID = "U1", Username = "Hung", DisplayName = "Hung", IsActive = true },
        //            new() { UserID = "U2", Username = "Long", DisplayName = "Long", IsActive = false }
        //        };

        //    _userRepoMock.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(users);
        //    _userRepoMock.Setup(r => r.GetAllUsersWithRolesAsync(1, 10)).ReturnsAsync(users);

        //    _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOUser>>(users))
        //        .Returns(users.Select(u => new ResponseDTOUser { UserID = u.UserID, Username = u.Username }));

        //    var result = await _service.GetAllUsersAsync(new RequestFilterUser(), 1, 10);

        //    Assert.Equal(2, result.TotalCount);
        //    Assert.Equal(2, result.Items.Count());
        //}
        //[Fact(DisplayName = "GetAllUsersAsync - With search filter - Return matched users")]
        //public async Task GetAllUsersAsync_WithSearch_ReturnsFilteredUsers()
        //{
        //    _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepoMock.Object);

        //    var users = new List<User>
        //        {
        //            new() { UserID = "U1", Username = "Hung", DisplayName = "Hung Nguyen", Email = "hung@gmail.com" },
        //            new() { UserID = "U2", Username = "Long", DisplayName = "Tran Long", Email = "long@gmail.com" }
        //        };

        //    _userRepoMock.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(users);
        //    _userRepoMock.Setup(r => r.GetAllUsersWithRolesAsync(1, 10)).ReturnsAsync(users);

        //    _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOUser>>(It.IsAny<IEnumerable<User>>()))
        //        .Returns<IEnumerable<User>>(us => us.Select(u => new ResponseDTOUser { UserID = u.UserID, Username = u.Username }));

        //    var filter = new RequestFilterUser { search = "hung" };

        //    var result = await _service.GetAllUsersAsync(filter, 1, 10);

        //    Assert.Single(result.Items);
        //    Assert.Equal("U1", result.Items.First().UserID);
        //}
        //[Fact(DisplayName = "GetAllUsersAsync - With status filter - Return active users")]
        //public async Task GetAllUsersAsync_WithStatus_ReturnsFilteredUsers()
        //{
        //    _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepoMock.Object);

        //    var users = new List<User>
        //        {
        //            new() { UserID = "U1", Username = "Hung", IsActive = true },
        //            new() { UserID = "U2", Username = "Long", IsActive = false }
        //        };

        //    _userRepoMock.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(users);
        //    _userRepoMock.Setup(r => r.GetAllUsersWithRolesAsync(1, 10)).ReturnsAsync(users);

        //    _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOUser>>(It.IsAny<IEnumerable<User>>()))
        //        .Returns<IEnumerable<User>>(us => us.Select(u => new ResponseDTOUser { UserID = u.UserID, Username = u.Username }));

        //    var filter = new RequestFilterUser { status = true };

        //    var result = await _service.GetAllUsersAsync(filter, 1, 10);

        //    Assert.Single(result.Items);
        //    Assert.Equal("U1", result.Items.First().UserID);
        //}
        //[Fact(DisplayName = "GetAllUsersAsync - With roleId filter - Return users having that role")]
        //public async Task GetAllUsersAsync_WithRoleId_ReturnsFilteredUsers()
        //{
        //    _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepoMock.Object);

        //    var users = new List<User>
        //    {
        //        new()
        //        {
        //            UserID = "U1",
        //            Username = "Hung",
        //            UserRoles = new List<UserRole> { new() { RoleID = "R1" } }
        //        },
        //        new()
        //        {
        //            UserID = "U2",
        //            Username = "Long",
        //            UserRoles = new List<UserRole> { new() { RoleID = "R2" } }
        //        }
        //    };

        //    _userRepoMock.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(users);
        //    _userRepoMock.Setup(r => r.GetAllUsersWithRolesAsync(1, 10)).ReturnsAsync(users);

        //    _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOUser>>(It.IsAny<IEnumerable<User>>()))
        //        .Returns<IEnumerable<User>>(us => us.Select(u => new ResponseDTOUser { UserID = u.UserID, Username = u.Username }));

        //    var filter = new RequestFilterUser { roleId = "R1" };

        //    var result = await _service.GetAllUsersAsync(filter, 1, 10);

        //    Assert.Single(result.Items);
        //    Assert.Equal("U1", result.Items.First().UserID);
        //}

        //[Fact(DisplayName = "GetAllUsersAsync - Return empty when no data")]
        //public async Task GetAllUsersAsync_ReturnsEmpty_WhenNoUsers()
        //{
        //    // Arrange
        //    _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepoMock.Object);

        //    _userRepoMock.Setup(r => r.GetAllUsersAsync())
        //        .ReturnsAsync(new List<User>());

        //    _userRepoMock.Setup(r => r.GetAllUsersWithRolesAsync(1, 10))
        //        .ReturnsAsync(new List<User>());

        //    _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOUser>>(It.IsAny<List<User>>()))
        //        .Returns(new List<ResponseDTOUser>());

        //    // Act
        //    var result = await _service.GetAllUsersAsync(new RequestFilterUser(), 1, 10);

        //    // Assert
        //    Assert.NotNull(result);
        //    Assert.Empty(result.Items);
        //    Assert.Equal(0, result.TotalCount);
        //}
        //[Fact(DisplayName = "GetAllUsersAsync - Empty list but search keyword returns empty result")]
        //public async Task GetAllUsersAsync_EmptyListWithSearch_ReturnsEmptyPagedResult()
        //{
        //    // Arrange
        //    var userRepo = new Mock<IUserRepositories>();
        //    _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);

        //    // Empty Database
        //    userRepo.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(new List<User>());
        //    userRepo.Setup(r => r.GetAllUsersWithRolesAsync(It.IsAny<int>(), It.IsAny<int>()))
        //            .ReturnsAsync(new List<User>());

        //    var filter = new RequestFilterUser { search = "Alice" };

        //    // Act
        //    var result = await _service.GetAllUsersAsync(filter, 1, 10);

        //    // Assert
        //    Assert.NotNull(result);
        //    Assert.Empty(result.Items);
        //    Assert.Equal(0, result.TotalCount);
        //}
        // GetUserByIDAsync
        [Fact(DisplayName = "GetUserByIDAsync - Found user returns DTO")]
        public async Task GetUserByIDAsync_Found_ReturnsDTO()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            userRepo.Setup(r => r.GetUserByIDWithDetailAsync("U1"))
                .ReturnsAsync(new User { UserID = "U1", Username = "Alice" });

            _mapperMock.Setup(m => m.Map<ResponseDTOUser>(It.IsAny<User>())).Returns(new ResponseDTOUser { UserID = "U1" });

            var result = await _service.GetUserByIDAsync("U1");
            Assert.NotNull(result);
            Assert.Equal("U1", result.UserID);
        }

        [Fact(DisplayName = "GetUserByIDAsync - Not found returns null")]
        public async Task GetUserByIDAsync_NotFound_ReturnsNull()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            userRepo.Setup(r => r.GetUserByIDWithDetailAsync("U1")).ReturnsAsync((User?)null);

            var result = await _service.GetUserByIDAsync("U1");
            Assert.Null(result);
        }
        // GetUserByIDAsync - param null -> returns null
        [Fact(DisplayName = "GetUserByIDAsync - Null param returns null")]
        public async Task GetUserByIDAsync_NullParam_ReturnsNull()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);

            // Setup repo trả về null khi nhận null
            userRepo.Setup(r => r.GetUserByIDWithDetailAsync((string?)null))
                    .ReturnsAsync((User?)null);

            var result = await _service.GetUserByIDAsync(null!);
            Assert.Null(result);
        }

        // GetUserByIDAsync - param empty -> returns null
        [Fact(DisplayName = "GetUserByIDAsync - Empty param returns null")]
        public async Task GetUserByIDAsync_EmptyParam_ReturnsNull()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            userRepo.Setup(r => r.GetUserByIDWithDetailAsync(string.Empty))
                    .ReturnsAsync((User?)null);

            var result = await _service.GetUserByIDAsync(string.Empty);
            Assert.Null(result);
        }

        // UpdateUserAsync
        [Fact(DisplayName = "UpdateUserAsync - User not found returns message")]
        public async Task UpdateUserAsync_UserNotFound_ReturnsMessage()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            userRepo.Setup(r => r.GetUserByIDWithDetailAsync("USER-NotFound")).ReturnsAsync((User?)null);

            var msg = await _service.UpdateUserAsync("USER-NotFound", new RequestUpdateUser());
            Assert.Equal("User not found!", msg);
        }

        //[Fact(DisplayName = "UpdateUserAsync - Should pass correct data to repository")]
        //public async Task UpdateUserAsync_ShouldPassCorrectData()
        //{
        //    // ARRANGE
        //    var userRepo = new Mock<IUserRepositories>();
        //    _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);

        //    var existingUser = new User
        //    {
        //        UserID = "USER-20251109-112345",
        //        DisplayName = "Old Name",
        //        PhoneNumber = "0900000000",
        //        UserUrlImage = "http://oldimage.com"
        //    };

        //    userRepo.Setup(r => r.GetUserByIDWithDetailAsync("USER-20251109-112345"))
        //            .ReturnsAsync(existingUser);

        //    var request = new RequestUpdateUser
        //    {
        //        IsActive = true,
        //        PhoneNumber = "0975480872",
        //        DisplayName = "Khanh",
        //        RolesId = "User",
        //        UserUrlImage = "http://newimage.com"
        //    };

        //    userRepo.Setup(r => r.UpdateUserAsync(existingUser, request))
        //            .ReturnsAsync("Updated");

        //    // ACT
        //    var result = await _service.UpdateUserAsync("USER-20251109-112345", request);

        //    // ASSERT
        //    Assert.Equal("Updated", result);

        //    userRepo.Verify(r => r.UpdateUserAsync(
        //        It.Is<User>(u =>
        //            u.UserID == "USER-20251109-112345" &&
        //            u.DisplayName == existingUser.DisplayName &&
        //            u.PhoneNumber == existingUser.PhoneNumber
        //        ),
        //        It.Is<RequestUpdateUser>(req =>
        //            req.IsActive == true &&
        //            req.PhoneNumber == "0975480734" &&
        //            req.DisplayName == "Hưng" &&
        //            req.RolesId == "ROLE-ADMIN" &&
        //            req.UserUrlImage == "http://newimage.com"
        //        )
        //    ), Times.Once);
        //}


        // UpdateUserAsync - param null -> returns "User not found!"
        [Fact(DisplayName = "UpdateUserAsync - Null param returns message")]
        public async Task UpdateUserAsync_NullParam_ReturnsMessage()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);

            userRepo.Setup(r => r.GetUserByIDWithDetailAsync((string?)null))
                    .ReturnsAsync((User?)null);

            var msg = await _service.UpdateUserAsync(null!, new RequestUpdateUser());
            Assert.Equal("User not found!", msg);
        }

        // UpdateUserAsync - param empty -> returns "User not found!"
        [Fact(DisplayName = "UpdateUserAsync - Empty param returns message")]
        public async Task UpdateUserAsync_EmptyParam_ReturnsMessage()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);

            userRepo.Setup(r => r.GetUserByIDWithDetailAsync(string.Empty))
                    .ReturnsAsync((User?)null);

            var msg = await _service.UpdateUserAsync(string.Empty, new RequestUpdateUser());
            Assert.Equal("User not found!", msg);
        }
        [Fact(DisplayName = "RequestUpdateUser - Invalid Dob returns validation error")]
        public void RequestUpdateUser_InvalidDob_ValidationFails()
        {
            var dto = new RequestUpdateUser { Dob = DateTime.Now.AddDays(1) };
            var context = new ValidationContext(dto);
            var result = RequestUpdateUser.ValidateDob(dto.Dob, context);
            Assert.NotEqual(ValidationResult.Success, result);
            Assert.Equal("Ngày sinh không được lớn hơn ngày hiện tại", result?.ErrorMessage);
        }

        [Fact(DisplayName = "RequestUpdateUser - DisplayName too short validation fails")]
        public void RequestUpdateUser_DisplayNameTooShort_Fails()
        {
            var dto = new RequestUpdateUser { DisplayName = "A" };
            var context = new ValidationContext(dto);
            var results = new List<ValidationResult>();
            var valid = Validator.TryValidateObject(dto, context, results, true);
            Assert.False(valid);
            Assert.Contains(results, r => r.ErrorMessage!.Contains("phải từ 3–50 ký tự"));
        }
        [Fact(DisplayName = "RequestUpdateUser - Invalid phone number fails validation")]
        public void RequestUpdateUser_InvalidPhoneNumber_Fails()
        {
            var dto = new RequestUpdateUser { PhoneNumber = "abc123" };
            var context = new ValidationContext(dto);
            var results = new List<ValidationResult>();
            var valid = Validator.TryValidateObject(dto, context, results, true);
            Assert.False(valid);
            Assert.Contains(results, r => r.ErrorMessage!.Contains("không hợp lệ"));
        }
        //[Fact(DisplayName = "RequestUpdateUser - Missing RolesId fails validation")]
        //public void RequestUpdateUser_MissingRolesId_Fails()
        //{
        //    var dto = new RequestUpdateUser { RolesId = null };
        //    var context = new ValidationContext(dto);
        //    var results = new List<ValidationResult>();
        //    var valid = Validator.TryValidateObject(dto, context, results, true);
        //    Assert.False(valid);
        //    Assert.Contains(results, r => r.ErrorMessage!.Contains("bắt buộc"));
        //}
        //[Fact(DisplayName = "RequestUpdateUser - Invalid image URL fails validation")]
        //public void RequestUpdateUser_InvalidUrl_Fails()
        //{
        //    var dto = new RequestUpdateUser { UserUrlImage = "not-a-url" };
        //    var context = new ValidationContext(dto);
        //    var results = new List<ValidationResult>();
        //    var valid = Validator.TryValidateObject(dto, context, results, true);
        //    Assert.False(valid);
        //    Assert.Contains(results, r => r.ErrorMessage!.Contains("không hợp lệ"));
        //}



        // ==== RefreshTokenAsync ====

        [Fact(DisplayName = "RefreshTokenAsync - Valid refresh token returns new tokens")]
        public async Task RefreshTokenAsync_Valid_ReturnsTokens()
        {
            var refreshRepo = new Mock<IRefreshTokenRepository>();
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);

            var token = new RefreshToken
            {
                Token = "token",
                UserId = "U1",
                Expires = DateTime.UtcNow.AddDays(1),
                Revoked = null
            };

            var user = new User
            {
                UserID = "U1",
                Username = "khanh",
                UserRoles = new List<UserRole>() // đảm bảo không null
            };

            refreshRepo.Setup(r => r.GetByTokenAsync("token")).ReturnsAsync(token);
            userRepo.Setup(r => r.GetByIdAsync("U1")).ReturnsAsync(user);

            var result = await _service.RefreshTokenAsync("token");

            Assert.NotNull(result);
            Assert.False(string.IsNullOrEmpty(result.AccessToken));

            refreshRepo.Verify(r => r.RemoveByTokenAsync(It.IsAny<RefreshToken>()), Times.Once);
            refreshRepo.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        // ------------------------------------------------------

        [Fact(DisplayName = "RefreshTokenAsync - Token not found returns null")]
        public async Task RefreshTokenAsync_TokenNotFound_ReturnsNull()
        {
            var refreshRepo = new Mock<IRefreshTokenRepository>();
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);
            refreshRepo.Setup(r => r.GetByTokenAsync("invalid")).ReturnsAsync((RefreshToken?)null);

            var result = await _service.RefreshTokenAsync("invalid");

            Assert.Null(result);
            refreshRepo.Verify(r => r.RemoveByTokenAsync(It.IsAny<RefreshToken>()), Times.Never);
        }

        // ------------------------------------------------------

        [Fact(DisplayName = "RefreshTokenAsync - Token expired returns null")]
        public async Task RefreshTokenAsync_TokenExpired_ReturnsNull()
        {
            var refreshRepo = new Mock<IRefreshTokenRepository>();
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);

            var expiredToken = new RefreshToken
            {
                Token = "token",
                UserId = "U1",
                Expires = DateTime.UtcNow.AddMinutes(-5), // hết hạn
                Revoked = null
            };

            refreshRepo.Setup(r => r.GetByTokenAsync("token")).ReturnsAsync(expiredToken);

            var result = await _service.RefreshTokenAsync("token");

            Assert.Null(result);
        }

        // ------------------------------------------------------

        [Fact(DisplayName = "RefreshTokenAsync - Token revoked returns null")]
        public async Task RefreshTokenAsync_TokenRevoked_ReturnsNull()
        {
            var refreshRepo = new Mock<IRefreshTokenRepository>();
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);

            var revokedToken = new RefreshToken
            {
                Token = "token",
                UserId = "U1",
                Expires = DateTime.UtcNow.AddDays(1),
                Revoked = DateTime.UtcNow 
            };

            refreshRepo.Setup(r => r.GetByTokenAsync("token")).ReturnsAsync(revokedToken);

            var result = await _service.RefreshTokenAsync("token");

            Assert.Null(result);
        }

        // ------------------------------------------------------

        [Fact(DisplayName = "RefreshTokenAsync - User not found returns null")]
        public async Task RefreshTokenAsync_UserNotFound_ReturnsNull()
        {
            var refreshRepo = new Mock<IRefreshTokenRepository>();
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);

            var validToken = new RefreshToken
            {
                Token = "token",
                UserId = "U1",
                Expires = DateTime.UtcNow.AddDays(1),
                Revoked = null
            };

            refreshRepo.Setup(r => r.GetByTokenAsync("token")).ReturnsAsync(validToken);
            userRepo.Setup(r => r.GetByIdAsync("U1")).ReturnsAsync((User?)null);

            var result = await _service.RefreshTokenAsync("token");

            Assert.Null(result);
            refreshRepo.Verify(r => r.RemoveByTokenAsync(It.IsAny<RefreshToken>()), Times.Never);
        }

        // ------------------------------------------------------

        [Fact(DisplayName = "RefreshTokenAsync - Ensure database operations called once")]
        public async Task RefreshTokenAsync_Valid_EnsuresRepositoryCalls()
        {
            var refreshRepo = new Mock<IRefreshTokenRepository>();
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);

            var token = new RefreshToken
            {
                Token = "token",
                UserId = "U1",
                Expires = DateTime.UtcNow.AddHours(1),
                Revoked = null
            };

            var user = new User
            {
                UserID = "U1",
                Username = "khanh",
                UserRoles = new List<UserRole>()
            };

            refreshRepo.Setup(r => r.GetByTokenAsync("token")).ReturnsAsync(token);
            userRepo.Setup(r => r.GetByIdAsync("U1")).ReturnsAsync(user);

            await _service.RefreshTokenAsync("token");

            refreshRepo.Verify(r => r.RemoveByTokenAsync(token), Times.Once);
            refreshRepo.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
        // ------------------------------------------------------

        // Test case: Empty token
        [Fact(DisplayName = "RefreshTokenAsync - Empty token returns null")]
        public async Task RefreshTokenAsync_EmptyToken_ReturnsNull()
        {
            var result = await _service.RefreshTokenAsync("");

            Assert.Null(result);
        }

        // ------------------------------------------------------

        // Test case: Null token
        [Fact(DisplayName = "RefreshTokenAsync - Null token returns null")]
        public async Task RefreshTokenAsync_NullToken_ReturnsNull()
        {
            var result = await _service.RefreshTokenAsync(null!);

            Assert.Null(result);
        }


        // Logout
        [Fact(DisplayName = "LogoutAsync - Valid token revokes successfully")]
        public async Task LogoutAsync_ValidToken_ReturnsTrue()
        {
            var refreshRepo = new Mock<IRefreshTokenRepository>();
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);

            var token = new RefreshToken
            {
                Token = "token",
                Expires = DateTime.UtcNow.AddMinutes(5),
                Revoked = null
            };

            refreshRepo.Setup(r => r.GetByTokenAsync("token")).ReturnsAsync(token);

            var result = await _service.LogoutAsync("token");

            Assert.True(result);
            Assert.NotNull(token.Revoked);
        }
        [Fact(DisplayName = "LogoutAsync - Token not found returns false")]
        public async Task LogoutAsync_TokenNotFound_ReturnsFalse()
        {
            var refreshRepo = new Mock<IRefreshTokenRepository>();
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);
            refreshRepo.Setup(r => r.GetByTokenAsync("token")).ReturnsAsync((RefreshToken?)null);

            var result = await _service.LogoutAsync("token");
            Assert.False(result);
        }

        [Fact(DisplayName = "LogoutAsync - Already revoked token returns false")]
        public async Task LogoutAsync_AlreadyRevoked_ReturnsFalse()
        {
            var refreshRepo = new Mock<IRefreshTokenRepository>();
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);

            var token = new RefreshToken
            {
                Token = "token",
                Expires = DateTime.UtcNow.AddMinutes(10),
                Revoked = DateTime.UtcNow.AddMinutes(-5) // đã bị revoke
            };

            refreshRepo.Setup(r => r.GetByTokenAsync("token")).ReturnsAsync(token);

            var result = await _service.LogoutAsync("token");
            Assert.False(result);
        }

        [Fact(DisplayName = "LogoutAsync - Expired token returns false")]
        public async Task LogoutAsync_ExpiredToken_ReturnsFalse()
        {
            var refreshRepo = new Mock<IRefreshTokenRepository>();
            _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(refreshRepo.Object);

            var token = new RefreshToken
            {
                Token = "token",
                Expires = DateTime.UtcNow.AddMinutes(-1), // hết hạn
                Revoked = null
            };

            refreshRepo.Setup(r => r.GetByTokenAsync("token")).ReturnsAsync(token);

            var result = await _service.LogoutAsync("token");
            Assert.False(result);
        }

        [Fact(DisplayName = "LogoutAsync - Empty or null token returns false")]
        public async Task LogoutAsync_EmptyOrNullToken_ReturnsFalse()
        {
            string token = "";
            var result = await _service.LogoutAsync(token);
            Assert.False(result);
            // Actual  System.NullReferenceException: 'Object reference not set to an instance of an object.'
        }

        // ForgotPasswordAsync

        [Fact(DisplayName = "ForgotPasswordAsync - Valid email sends OTP")]
        public async Task ForgotPasswordAsync_ValidEmail_ReturnsTrue()
        {
            var userRepo = new Mock<IUserRepositories>();
            var otpRepo = new Mock<IUserOtpRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);

            userRepo.Setup(r => r.GetUserByEmailAsync("mail@gmail.com"))
                .ReturnsAsync(new User { Email = "mail@gmail.com", Username = "khanh" });

            var result = await _service.ForgotPasswordAsync("mail@gmail.com");
            Assert.True(result);
            _emailServiceMock.Verify(e => e.SendEmailAsync("mail@gmail.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Fact(DisplayName = "ForgotPasswordAsync - Email not found returns false")]
        public async Task ForgotPasswordAsync_InvalidEmail_ReturnsFalse()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            userRepo.Setup(r => r.GetUserByEmailAsync("none@gmail.com")).ReturnsAsync((User?)null);

            var result = await _service.ForgotPasswordAsync("none@gmail.com");
            Assert.False(result);
        }

        [Fact(DisplayName = "ForgotPasswordAsync - OTP entity created correctly")]
        public async Task ForgotPasswordAsync_OTPStoredCorrectly()
        {
            var userRepo = new Mock<IUserRepositories>();
            var otpRepo = new Mock<IUserOtpRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            _unitOfWorkMock.Setup(u => u.UserOtps).Returns(otpRepo.Object);

            UserOtp? capturedOtp = null;
            otpRepo.Setup(r => r.AddOtpAsync(It.IsAny<UserOtp>()))
                   .Callback<UserOtp>(otp => capturedOtp = otp)
                   .Returns(Task.CompletedTask);

            userRepo.Setup(r => r.GetUserByEmailAsync("mail@gmail.com"))
                    .ReturnsAsync(new User { Email = "mail@gmail.com", Username = "khanh" });

            var result = await _service.ForgotPasswordAsync("mail@gmail.com");

            Assert.True(result);
            Assert.NotNull(capturedOtp);
            Assert.Equal("mail@gmail.com", capturedOtp.Email);
            Assert.False(capturedOtp.IsUsed);
            Assert.InRange(capturedOtp.ExpiresAt, DateTime.UtcNow.AddMinutes(4.9), DateTime.UtcNow.AddMinutes(5.1));
        }

        [Fact(DisplayName = "ForgotPasswordAsync - empty email")]
        public async Task ForgotPasswordAsync_OTPExpiresInFiveMinutes()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            var result = await _service.ForgotPasswordAsync("");
            Assert.False(result);
        }


        // ChangePasswordAsync
        [Fact(DisplayName = "ChangePasswordAsync - Wrong old password returns message")]
        public async Task ChangePasswordAsync_WrongOldPassword_ReturnsMessage()
        {
            var userRepo = new Mock<IUserRepositories>();
            _unitOfWorkMock.Setup(u => u.Users).Returns(userRepo.Object);
            var oldHash = Convert.ToBase64String(System.Security.Cryptography.SHA256.Create().ComputeHash(System.Text.Encoding.UTF8.GetBytes("old")));

            userRepo.Setup(r => r.GetByIdAsync("U1")).ReturnsAsync(new User { UserID = "U1", PasswordHash = oldHash });

            var msg = await _service.ChangePasswordAsync("U1", new RequestUpdateUserHashPassword
            {
                OldPassword = "wrong",
                NewPassword = "new123",
                ConfirmNewPassword = "new123"
            });

            Assert.Equal("Wrong old password", msg);
        }
        [Theory(DisplayName = "RequestUpdateUserHashPassword - Invalid data fails validation")]
        [InlineData("", "NewPass1A", "NewPass1A", "Mật khẩu cũ không được để trống")]
        [InlineData("OldPass1", "", "NewPass1A", "Mật khẩu mới không được để trống")]
        [InlineData("OldPass1", "NewPass1A", "", "Vui lòng xác nhận mật khẩu mới")]
        [InlineData("OldPass1", "short", "short", "Mật khẩu mới phải có ít nhất 6 ký tự")]
        [InlineData("OldPass1", "nopassword123", "nopassword123", "Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số")]
        public void RequestUpdateUserHashPassword_InvalidData_ReturnsValidationError(
         string oldPassword, string newPassword, string confirmPassword, string expectedError)
        {
            var dto = new RequestUpdateUserHashPassword
            {
                OldPassword = oldPassword,
                NewPassword = newPassword,
                ConfirmNewPassword = confirmPassword
            };

            var results = new List<ValidationResult>();
            var context = new ValidationContext(dto);

            bool isValid = Validator.TryValidateObject(dto, context, results, true);

            Assert.False(isValid);
            Assert.Contains(results, r => r.ErrorMessage.Contains(expectedError));
        }

    }
}
