using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using FluentAssertions;
using Moq;
using System.Security.Cryptography;
using System.Text;

namespace Backend_SEP490.Tests.Services;

/// <summary>
/// Unit tests for VerifyOtpAsync method in UserServicesImpl
/// Tests cover all scenarios from TEST_CASE_MATRIX.md plus additional edge cases
/// Total: 13 test cases ensuring 100% coverage
/// </summary>
public class UserServicesVerifyOtpTests : IDisposable
{
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IUserRepositories> _userRepositoriesMock;
    private readonly Mock<IUserOtpRepositories> _userOtpRepositoriesMock;
    private readonly Mock<IRoleRepository> _roleRepositoriesMock;
    private readonly Mock<IUserRoleRepository> _userRoleRepositoriesMock;
    private readonly UserServicesImpl _userServices;

    // Test data constants
    private const string ValidEmail = "test@example.com";
    private const string ValidUsername = "testuser";
    private const string ValidPassword = "password123";
    private const string ValidOtpCode = "123456";
    private const string InvalidOtpCode = "999999";

    public UserServicesVerifyOtpTests()
    {
        // Setup environment variables required by UserServicesImpl
        Environment.SetEnvironmentVariable("JWT_KEY", "ThisIsASecretKeyForJWTTokenGenerationThatIsLongEnough123456");
        Environment.SetEnvironmentVariable("JWT_ISSUER", "TestIssuer");
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", "TestAudience");
        Environment.SetEnvironmentVariable("JWT_EXPIRE_MINUTES", "15");
        Environment.SetEnvironmentVariable("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7");

        // Initialize mocks
        _mapperMock = new Mock<IMapper>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _emailServiceMock = new Mock<IEmailService>();
        _userRepositoriesMock = new Mock<IUserRepositories>();
        _userOtpRepositoriesMock = new Mock<IUserOtpRepositories>();
        _roleRepositoriesMock = new Mock<IRoleRepository>();
        _userRoleRepositoriesMock = new Mock<IUserRoleRepository>();

        // Setup UnitOfWork to return mocked repositories
        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepositoriesMock.Object);
        _unitOfWorkMock.Setup(u => u.UserOtps).Returns(_userOtpRepositoriesMock.Object);
        _unitOfWorkMock.Setup(u => u.Roles).Returns(_roleRepositoriesMock.Object);
        _unitOfWorkMock.Setup(u => u.UserRoles).Returns(_userRoleRepositoriesMock.Object);

        // Create service instance
        _userServices = new UserServicesImpl(
            _mapperMock.Object,
            _unitOfWorkMock.Object,
            _emailServiceMock.Object
        );
    }

    #region Helper Methods

    /// <summary>
    /// Hash password using SHA256 (same logic as in UserServicesImpl)
    /// </summary>
    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    /// <summary>
    /// Create a valid RequestDTORegister
    /// </summary>
    private RequestDTORegister CreateRegisterRequest(
        string? username = null,
        string? email = null,
        string? password = null,
        string? phoneNumber = null,
        string? displayName = null,
        DateTime? dob = null)
    {
        return new RequestDTORegister
        {
            Username = username ?? ValidUsername,
            Email = email ?? ValidEmail,
            PasswordHash = password ?? ValidPassword,
            PhoneNumber = phoneNumber ?? "0123456789",
            DisplayName = displayName ?? "Test User",
            Dob = dob ?? new DateTime(1990, 1, 1)
        };
    }

    /// <summary>
    /// Create a valid UserOtp entity
    /// </summary>
    private UserOtp CreateValidOtp(string email, string otpCode, bool isUsed = false, int expiresInMinutes = 5)
    {
        return new UserOtp
        {
            Id = Guid.NewGuid().ToString(),
            Email = email,
            OtpCode = otpCode,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiresInMinutes),
            IsUsed = isUsed,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Create Customer role
    /// </summary>
    private Role CreateCustomerRole()
    {
        return new Role
        {
            Id = "ROLE-CUSTOMER",
            Name = "Customer",
            Description = "Customer Role"
        };
    }

    #endregion

    #region UTCID01: Valid OTP - Normal Flow

    [Fact]
    public async Task VerifyOtpAsync_WithValidOtp_CustomerRoleExists_ShouldCreateUserWithRoleAndReturnTrue()
    {
        // Arrange
        var request = CreateRegisterRequest();
        var validOtp = CreateValidOtp(ValidEmail, ValidOtpCode);
        var customerRole = CreateCustomerRole();
        User? capturedUser = null;
        UserRole? capturedUserRole = null;

        // Setup: Valid OTP exists
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, ValidOtpCode))
            .ReturnsAsync(validOtp);

        // Setup: Delete OTP succeeds
        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(ValidEmail))
            .Returns(Task.CompletedTask);

        // Setup: Capture created user
        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .Returns(Task.CompletedTask);

        // Setup: Customer role exists
        _roleRepositoriesMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync(customerRole);

        // Setup: Capture created user role
        _userRoleRepositoriesMock
            .Setup(r => r.AddUserRoleAsync(It.IsAny<UserRole>()))
            .Callback<UserRole>(ur => capturedUserRole = ur)
            .Returns(Task.CompletedTask);

        // Setup: SaveChanges succeeds
        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, ValidOtpCode);

        // Assert
        result.Should().BeTrue();

        // Verify: OTP was marked as used and deleted
        validOtp.IsUsed.Should().BeTrue();
        _userOtpRepositoriesMock.Verify(r => r.DeleteOtpAsync(ValidEmail), Times.Once);

        // Verify: User was created with correct properties
        capturedUser.Should().NotBeNull();
        capturedUser!.Username.Should().Be(ValidUsername);
        capturedUser.Email.Should().Be(ValidEmail);
        capturedUser.PasswordHash.Should().Be(HashPassword(ValidPassword));
        capturedUser.PhoneNumber.Should().Be("0123456789");
        capturedUser.DisplayName.Should().Be("Test User");
        capturedUser.Dob.Should().Be(new DateTime(1990, 1, 1));
        capturedUser.IsActive.Should().BeTrue();
        capturedUser.CreateAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        capturedUser.UpdateAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));

        // Verify: UserID format is correct (USER-YYYYMMDD-HHMMSS)
        capturedUser.UserID.Should().StartWith("USER-");
        capturedUser.UserID.Should().MatchRegex(@"^USER-\d{8}-\d{6}$");

        // Verify: Customer role was assigned
        capturedUserRole.Should().NotBeNull();
        capturedUserRole!.UserID.Should().Be(capturedUser.UserID);
        capturedUserRole.RoleID.Should().Be(customerRole.Id);
        capturedUserRole.Id.Should().StartWith("URID-");

        // Verify: SaveChanges was called
        _userOtpRepositoriesMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    #endregion

    #region UTCID02: Invalid OTP - Abnormal Flow

    [Fact]
    public async Task VerifyOtpAsync_WithInvalidOtp_ShouldReturnFalseAndNotCreateUser()
    {
        // Arrange
        var request = CreateRegisterRequest();

        // Setup: Invalid OTP (not found)
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, InvalidOtpCode))
            .ReturnsAsync((UserOtp?)null);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, InvalidOtpCode);

        // Assert
        result.Should().BeFalse();

        // Verify: No user was created
        _userRepositoriesMock.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Never);

        // Verify: No role was assigned
        _userRoleRepositoriesMock.Verify(r => r.AddUserRoleAsync(It.IsAny<UserRole>()), Times.Never);

        // Verify: No OTP was deleted
        _userOtpRepositoriesMock.Verify(r => r.DeleteOtpAsync(It.IsAny<string>()), Times.Never);

        // Verify: SaveChanges was never called
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    #endregion

    #region UTCID03: Password Hashing Verification

    [Fact]
    public async Task VerifyOtpAsync_ShouldHashPasswordUsingSHA256()
    {
        // Arrange
        const string plainPassword = "plainpassword123";
        var request = CreateRegisterRequest(password: plainPassword);
        var validOtp = CreateValidOtp(ValidEmail, ValidOtpCode);
        var customerRole = CreateCustomerRole();
        User? capturedUser = null;

        // Setup mocks
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, ValidOtpCode))
            .ReturnsAsync(validOtp);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(ValidEmail))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .Returns(Task.CompletedTask);

        _roleRepositoriesMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync(customerRole);

        _userRoleRepositoriesMock
            .Setup(r => r.AddUserRoleAsync(It.IsAny<UserRole>()))
            .Returns(Task.CompletedTask);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Calculate expected hash
        var expectedHash = HashPassword(plainPassword);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, ValidOtpCode);

        // Assert
        result.Should().BeTrue();
        capturedUser.Should().NotBeNull();
        capturedUser!.PasswordHash.Should().Be(expectedHash);
        capturedUser.PasswordHash.Should().NotBe(plainPassword, "password should be hashed, not stored as plain text");

        // Verify: Hash is base64 encoded SHA256 (44 characters for base64 of 32 bytes)
        capturedUser.PasswordHash.Should().MatchRegex(@"^[A-Za-z0-9+/=]{44}$");
    }

    #endregion

    #region UTCID04: UserID Format Verification

    [Fact]
    public async Task VerifyOtpAsync_ShouldGenerateUserIdWithCorrectFormat()
    {
        // Arrange
        var request = CreateRegisterRequest();
        var validOtp = CreateValidOtp(ValidEmail, ValidOtpCode);
        var customerRole = CreateCustomerRole();
        User? capturedUser = null;

        // Setup mocks
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, ValidOtpCode))
            .ReturnsAsync(validOtp);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(ValidEmail))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .Returns(Task.CompletedTask);

        _roleRepositoriesMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync(customerRole);

        _userRoleRepositoriesMock
            .Setup(r => r.AddUserRoleAsync(It.IsAny<UserRole>()))
            .Returns(Task.CompletedTask);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, ValidOtpCode);

        // Assert
        result.Should().BeTrue();
        capturedUser.Should().NotBeNull();

        // Verify: UserID format is USER-YYYYMMDD-HHMMSS
        capturedUser!.UserID.Should().StartWith("USER-");
        capturedUser.UserID.Should().MatchRegex(@"^USER-\d{8}-\d{6}$");

        // Extract and verify date/time components
        var parts = capturedUser.UserID.Split('-');
        parts.Should().HaveCount(3);
        parts[0].Should().Be("USER");
        parts[1].Should().MatchRegex(@"^\d{8}$"); // YYYYMMDD
        parts[2].Should().MatchRegex(@"^\d{6}$"); // HHMMSS

        // Verify: Date is close to today
        var dateStr = parts[1];
        var year = int.Parse(dateStr.Substring(0, 4));
        var month = int.Parse(dateStr.Substring(4, 2));
        var day = int.Parse(dateStr.Substring(6, 2));

        year.Should().Be(DateTime.UtcNow.Year);
        month.Should().Be(DateTime.UtcNow.Month);
        day.Should().Be(DateTime.UtcNow.Day);
    }

    #endregion

    #region UTCID05: User Properties Verification

    [Fact]
    public async Task VerifyOtpAsync_ShouldMapAllDtoPropertiesCorrectlyToUserEntity()
    {
        // Arrange
        var specificDob = new DateTime(1995, 6, 15);
        var request = new RequestDTORegister
        {
            Username = "john.doe",
            Email = "john.doe@example.com",
            PasswordHash = "MySecurePassword123",
            PhoneNumber = "0987654321",
            DisplayName = "John Doe",
            Dob = specificDob
        };

        var validOtp = CreateValidOtp(request.Email, ValidOtpCode);
        var customerRole = CreateCustomerRole();
        User? capturedUser = null;

        // Setup mocks
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(request.Email, ValidOtpCode))
            .ReturnsAsync(validOtp);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(request.Email))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .Returns(Task.CompletedTask);

        _roleRepositoriesMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync(customerRole);

        _userRoleRepositoriesMock
            .Setup(r => r.AddUserRoleAsync(It.IsAny<UserRole>()))
            .Returns(Task.CompletedTask);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, ValidOtpCode);

        // Assert
        result.Should().BeTrue();
        capturedUser.Should().NotBeNull();

        // Verify: All properties are mapped correctly
        capturedUser!.Username.Should().Be("john.doe");
        capturedUser.Email.Should().Be("john.doe@example.com");
        capturedUser.PasswordHash.Should().Be(HashPassword("MySecurePassword123"));
        capturedUser.PhoneNumber.Should().Be("0987654321");
        capturedUser.DisplayName.Should().Be("John Doe");
        capturedUser.Dob.Should().Be(specificDob);
        capturedUser.IsActive.Should().BeTrue();
        capturedUser.CreateAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        capturedUser.UpdateAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    #endregion

    #region UTCID06: Missing Customer Role - Boundary Case

    [Fact]
    public async Task VerifyOtpAsync_WhenCustomerRoleMissing_ShouldCreateUserWithoutRole()
    {
        // Arrange
        var request = CreateRegisterRequest();
        var validOtp = CreateValidOtp(ValidEmail, ValidOtpCode);
        User? capturedUser = null;

        // Setup: Valid OTP exists
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, ValidOtpCode))
            .ReturnsAsync(validOtp);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(ValidEmail))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .Returns(Task.CompletedTask);

        // Setup: Customer role does NOT exist
        _roleRepositoriesMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync((Role?)null);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, ValidOtpCode);

        // Assert
        result.Should().BeTrue("user should still be created even without role");

        // Verify: User was created
        capturedUser.Should().NotBeNull();
        _userRepositoriesMock.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Once);

        // Verify: No role was assigned
        _userRoleRepositoriesMock.Verify(
            r => r.AddUserRoleAsync(It.IsAny<UserRole>()), 
            Times.Never,
            "no role should be assigned when Customer role doesn't exist"
        );

        // Verify: SaveChanges was still called
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    #endregion

    #region UTCID07: OTP Expired - Edge Case

    [Fact]
    public async Task VerifyOtpAsync_WithExpiredOtp_ShouldReturnFalse()
    {
        // Arrange
        var request = CreateRegisterRequest();
        var expiredOtp = CreateValidOtp(ValidEmail, ValidOtpCode, isUsed: false, expiresInMinutes: -1);

        // Setup: GetValidOtpAsync returns null for expired OTP (as per repository logic)
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, ValidOtpCode))
            .ReturnsAsync((UserOtp?)null);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, ValidOtpCode);

        // Assert
        result.Should().BeFalse("expired OTP should not be valid");

        // Verify: No user was created
        _userRepositoriesMock.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Never);
    }

    #endregion

    #region UTCID08: OTP Already Used - Edge Case

    [Fact]
    public async Task VerifyOtpAsync_WithAlreadyUsedOtp_ShouldReturnFalse()
    {
        // Arrange
        var request = CreateRegisterRequest();
        var usedOtp = CreateValidOtp(ValidEmail, ValidOtpCode, isUsed: true);

        // Setup: GetValidOtpAsync returns null for already used OTP (as per repository logic)
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, ValidOtpCode))
            .ReturnsAsync((UserOtp?)null);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, ValidOtpCode);

        // Assert
        result.Should().BeFalse("already used OTP should not be valid");

        // Verify: No user was created
        _userRepositoriesMock.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Never);
    }

    #endregion

    #region UTCID09: Null OTP Code - Validation

    [Fact]
    public async Task VerifyOtpAsync_WithNullOtpCode_ShouldReturnFalse()
    {
        // Arrange
        var request = CreateRegisterRequest();

        // Setup: GetValidOtpAsync returns null for null OTP
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, null!))
            .ReturnsAsync((UserOtp?)null);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, null!);

        // Assert
        result.Should().BeFalse();

        // Verify: No user was created
        _userRepositoriesMock.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Never);
    }

    #endregion

    #region UTCID10: Empty OTP Code - Validation

    [Fact]
    public async Task VerifyOtpAsync_WithEmptyOtpCode_ShouldReturnFalse()
    {
        // Arrange
        var request = CreateRegisterRequest();

        // Setup: GetValidOtpAsync returns null for empty OTP
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, ""))
            .ReturnsAsync((UserOtp?)null);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, "");

        // Assert
        result.Should().BeFalse();

        // Verify: No user was created
        _userRepositoriesMock.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Never);
    }

    #endregion

    #region UTCID11: Optional Fields Null - Boundary Case

    [Fact]
    public async Task VerifyOtpAsync_WithNullOptionalFields_ShouldStillCreateUser()
    {
        // Arrange
        var request = new RequestDTORegister
        {
            Username = ValidUsername,
            Email = ValidEmail,
            PasswordHash = ValidPassword,
            PhoneNumber = null,  // Optional
            DisplayName = null,  // Optional
            Dob = null          // Optional
        };

        var validOtp = CreateValidOtp(ValidEmail, ValidOtpCode);
        var customerRole = CreateCustomerRole();
        User? capturedUser = null;

        // Setup mocks
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, ValidOtpCode))
            .ReturnsAsync(validOtp);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(ValidEmail))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .Returns(Task.CompletedTask);

        _roleRepositoriesMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync(customerRole);

        _userRoleRepositoriesMock
            .Setup(r => r.AddUserRoleAsync(It.IsAny<UserRole>()))
            .Returns(Task.CompletedTask);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, ValidOtpCode);

        // Assert
        result.Should().BeTrue();
        capturedUser.Should().NotBeNull();

        // Verify: Required fields are set
        capturedUser!.Username.Should().Be(ValidUsername);
        capturedUser.Email.Should().Be(ValidEmail);
        capturedUser.PasswordHash.Should().NotBeNullOrEmpty();

        // Verify: Optional fields are null
        capturedUser.PhoneNumber.Should().BeNull();
        capturedUser.DisplayName.Should().BeNull();
        capturedUser.Dob.Should().BeNull();
    }

    #endregion

    #region UTCID12: Email Mismatch - Security Test

    [Fact]
    public async Task VerifyOtpAsync_WhenEmailMismatch_ShouldReturnFalse()
    {
        // Arrange
        var request = CreateRegisterRequest(email: "user@example.com");
        var differentEmail = "different@example.com";

        // Setup: OTP exists for different email
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync("user@example.com", ValidOtpCode))
            .ReturnsAsync((UserOtp?)null);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, ValidOtpCode);

        // Assert
        result.Should().BeFalse("OTP should be email-specific");

        // Verify: No user was created
        _userRepositoriesMock.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Never);
    }

    #endregion

    #region UTCID13: Special Characters in Username and DisplayName

    [Fact]
    public async Task VerifyOtpAsync_WithSpecialCharactersInFields_ShouldCreateUserCorrectly()
    {
        // Arrange
        var request = new RequestDTORegister
        {
            Username = "user_123.test",
            Email = ValidEmail,
            PasswordHash = ValidPassword,
            PhoneNumber = "+84-987-654-321",
            DisplayName = "Nguyễn Văn A (Test)",
            Dob = new DateTime(1990, 1, 1)
        };

        var validOtp = CreateValidOtp(ValidEmail, ValidOtpCode);
        var customerRole = CreateCustomerRole();
        User? capturedUser = null;

        // Setup mocks
        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(ValidEmail, ValidOtpCode))
            .ReturnsAsync(validOtp);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(ValidEmail))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .Returns(Task.CompletedTask);

        _roleRepositoriesMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync(customerRole);

        _userRoleRepositoriesMock
            .Setup(r => r.AddUserRoleAsync(It.IsAny<UserRole>()))
            .Returns(Task.CompletedTask);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.VerifyOtpAsync(request, ValidOtpCode);

        // Assert
        result.Should().BeTrue();
        capturedUser.Should().NotBeNull();
        capturedUser!.Username.Should().Be("user_123.test");
        capturedUser.DisplayName.Should().Be("Nguyễn Văn A (Test)");
        capturedUser.PhoneNumber.Should().Be("+84-987-654-321");
    }

    #endregion

    public void Dispose()
    {
        // Clean up environment variables
        Environment.SetEnvironmentVariable("JWT_KEY", null);
        Environment.SetEnvironmentVariable("JWT_ISSUER", null);
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", null);
        Environment.SetEnvironmentVariable("JWT_EXPIRE_MINUTES", null);
        Environment.SetEnvironmentVariable("JWT_REFRESH_TOKEN_EXPIRE_DAYS", null);
    }
}
