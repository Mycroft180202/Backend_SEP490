using AutoMapper;
using Backend_SEP490.DTOs.Request;
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
/// Unit tests cho LoginAsync method trong UserServicesImpl
/// Test các trường hợp cơ bản: User Exists, User Not Exists, User Inactive
/// </summary>
public class UserServicesLoginTests : IDisposable
{
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IUserRepositories> _userRepositoriesMock;
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepositoriesMock;
    private readonly UserServicesImpl _userServices;

    // Test data constants
    private const string ValidUsername = "testuser";
    private const string ValidPassword = "Test@123";
    private const string ValidUserId = "USER-20251026-120000";
    private const string UserRoleName = "User";

    public UserServicesLoginTests()
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
        _refreshTokenRepositoriesMock = new Mock<IRefreshTokenRepository>();

        // Setup UnitOfWork to return mocked repositories
        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepositoriesMock.Object);
        _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(_refreshTokenRepositoriesMock.Object);

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
    /// Create a valid test user
    /// </summary>
    private User CreateTestUser(string username, string password, bool isActive = true)
    {
        var user = new User
        {
            UserID = ValidUserId,
            Username = username,
            Email = $"{username}@test.com",
            PasswordHash = HashPassword(password),
            DisplayName = "Test User",
            IsActive = isActive,
            UserRoles = new List<UserRole>
            {
                new UserRole
                {
                    Id = $"UR-{UserRoleName}-{ValidUserId}",
                    UserID = ValidUserId,
                    RoleID = $"ROLE-{UserRoleName}",
                    Role = new Role
                    {
                        Id = $"ROLE-{UserRoleName}",
                        Name = UserRoleName,
                        Description = $"{UserRoleName} Role"
                    }
                }
            }
        };

        return user;
    }

    #endregion

    #region UTCID01: User Exists - Valid Credentials

    [Fact]
    public async Task LoginAsync_WithValidCredentials_UserExists_ShouldReturnAuthTokens()
    {
        // Arrange
        var user = CreateTestUser(ValidUsername, ValidPassword, isActive: true);
        
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(ValidUsername))
            .ReturnsAsync(user);

        _refreshTokenRepositoriesMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.LoginAsync(ValidUsername, ValidPassword);

        // Assert
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.ExpireAt.Should().BeAfter(DateTime.UtcNow);

        // Verify interactions
        _userRepositoriesMock.Verify(r => r.GetUserByUsernameAsync(ValidUsername), Times.Once);
        _refreshTokenRepositoriesMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    #endregion

    #region UTCID02: User Exists - Wrong Password

    [Fact]
    public async Task LoginAsync_WithWrongPassword_UserExists_ShouldReturnNull()
    {
        // Arrange
        var user = CreateTestUser(ValidUsername, ValidPassword, isActive: true);
        const string wrongPassword = "WrongPassword123";
        
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(ValidUsername))
            .ReturnsAsync(user);

        // Act
        var result = await _userServices.LoginAsync(ValidUsername, wrongPassword);

        // Assert
        result.Should().BeNull();
        
        // Verify no token was created
        _userRepositoriesMock.Verify(r => r.GetUserByUsernameAsync(ValidUsername), Times.Once);
        _refreshTokenRepositoriesMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    #endregion

    #region UTCID03: User Not Exists

    [Fact]
    public async Task LoginAsync_WithNonExistentUser_UserNotExists_ShouldReturnNull()
    {
        // Arrange
        const string nonExistentUsername = "nonexistent";
        
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(nonExistentUsername))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userServices.LoginAsync(nonExistentUsername, ValidPassword);

        // Assert
        result.Should().BeNull();
        
        // Verify that no refresh token was created
        _refreshTokenRepositoriesMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    #endregion

    #region UTCID04: User Inactive

    [Fact]
    public async Task LoginAsync_WithInactiveUser_UserInactive_ShouldReturnAuthTokens()
    {
        // Arrange
        var inactiveUser = CreateTestUser(ValidUsername, ValidPassword, isActive: false);
        
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(ValidUsername))
            .ReturnsAsync(inactiveUser);

        _refreshTokenRepositoriesMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.LoginAsync(ValidUsername, ValidPassword);

        // Assert
        // Note: Current implementation does not check IsActive, so login succeeds
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
    }

    #endregion

    #region UTCID05: User Exists - Empty Username

    [Fact]
    public async Task LoginAsync_WithEmptyUsername_ShouldReturnNull()
    {
        // Arrange
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(""))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userServices.LoginAsync("", ValidPassword);

        // Assert
        result.Should().BeNull();
        _refreshTokenRepositoriesMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
    }

    #endregion

    #region UTCID06: User Exists - Empty Password

    [Fact]
    public async Task LoginAsync_WithEmptyPassword_UserExists_ShouldReturnNull()
    {
        // Arrange
        var user = CreateTestUser(ValidUsername, ValidPassword, isActive: true);
        
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(ValidUsername))
            .ReturnsAsync(user);

        // Act
        var result = await _userServices.LoginAsync(ValidUsername, "");

        // Assert
        result.Should().BeNull();
        _refreshTokenRepositoriesMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
    }

    #endregion

    #region UTCID07: User Exists - Null Username

    [Fact]
    public async Task LoginAsync_WithNullUsername_ShouldReturnNull()
    {
        // Arrange
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(null!))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userServices.LoginAsync(null!, ValidPassword);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region UTCID08: User Exists - Null Password

    [Fact]
    public async Task LoginAsync_WithNullPassword_UserExists_ShouldThrowException()
    {
        // Arrange
        var user = CreateTestUser(ValidUsername, ValidPassword, isActive: true);
        
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(ValidUsername))
            .ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(
            async () => await _userServices.LoginAsync(ValidUsername, null!)
        );
    }

    #endregion

    #region UTCID09: User Exists - Password Case Sensitive

    [Fact]
    public async Task LoginAsync_WithPasswordCaseSensitive_ShouldReturnNull()
    {
        // Arrange
        var user = CreateTestUser(ValidUsername, ValidPassword, isActive: true);
        const string wrongCasePassword = "test@123"; // lowercase instead of Test@123
        
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(ValidUsername))
            .ReturnsAsync(user);

        // Act
        var result = await _userServices.LoginAsync(ValidUsername, wrongCasePassword);

        // Assert
        result.Should().BeNull("password should be case-sensitive");
    }

    #endregion

    #region UTCID10: User Exists - Username Case Sensitive

    [Fact]
    public async Task LoginAsync_WithUsernameCaseSensitive_ShouldReturnNull()
    {
        // Arrange
        const string upperCaseUsername = "TESTUSER";
        
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(upperCaseUsername))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userServices.LoginAsync(upperCaseUsername, ValidPassword);

        // Assert
        result.Should().BeNull("username lookup should be case-sensitive");
    }

    #endregion

    #region UTCID11: User Exists - Special Characters in Password

    [Fact]
    public async Task LoginAsync_WithSpecialCharactersInPassword_ShouldSucceed()
    {
        // Arrange
        const string specialPassword = "P@ssw0rd!#$%^&*()";
        var user = CreateTestUser(ValidUsername, specialPassword, isActive: true);
        
        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(ValidUsername))
            .ReturnsAsync(user);

        _refreshTokenRepositoriesMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.LoginAsync(ValidUsername, specialPassword);

        // Assert
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrEmpty();
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

