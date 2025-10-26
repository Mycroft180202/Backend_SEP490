using AutoMapper;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using FluentAssertions;
using Moq;

namespace Backend_SEP490.Tests.Services;

/// <summary>
/// Unit tests cho RefreshTokenAsync method trong UserServicesImpl
/// Test các trường hợp: Token Valid, Token Invalid, Token Expired, Token Revoked, User Not Found
/// </summary>
public class UserServicesRefreshTokenTests : IDisposable
{
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IUserRepositories> _userRepositoriesMock;
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepositoriesMock;
    private readonly UserServicesImpl _userServices;

    // Test data constants
    private const string ValidToken = "validtoken123456789012345678901234";
    private const string ValidUserId = "USER-20251026-120000";
    private const string ValidUsername = "testuser";

    public UserServicesRefreshTokenTests()
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
    /// Create a valid test user
    /// </summary>
    private User CreateTestUser(string userId, string username)
    {
        return new User
        {
            UserID = userId,
            Username = username,
            Email = $"{username}@test.com",
            DisplayName = "Test User",
            IsActive = true,
            UserRoles = new List<UserRole>
            {
                new UserRole
                {
                    Id = $"UR-User-{userId}",
                    UserID = userId,
                    RoleID = "ROLE-User",
                    Role = new Role
                    {
                        Id = "ROLE-User",
                        Name = "User",
                        Description = "User Role"
                    }
                }
            }
        };
    }

    /// <summary>
    /// Create a valid refresh token
    /// </summary>
    private RefreshToken CreateRefreshToken(string token, string userId, bool isExpired = false, bool isRevoked = false)
    {
        return new RefreshToken
        {
            Id = 1,
            Token = token,
            UserId = userId,
            Created = DateTime.UtcNow.AddDays(-1),
            Expires = isExpired ? DateTime.UtcNow.AddDays(-1) : DateTime.UtcNow.AddDays(6),
            Revoked = isRevoked ? DateTime.UtcNow.AddHours(-1) : null
        };
    }

    #endregion

    #region UTCID01: Token Valid - User Exists

    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_UserExists_ShouldReturnNewAuthTokens()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername);
        var oldToken = CreateRefreshToken(ValidToken, ValidUserId, isExpired: false, isRevoked: false);

        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(ValidToken))
            .ReturnsAsync(oldToken);

        _userRepositoriesMock
            .Setup(r => r.GetByIdAsync(ValidUserId))
            .ReturnsAsync(user);

        _refreshTokenRepositoriesMock
            .Setup(r => r.RemoveByTokenAsync(oldToken))
            .ReturnsAsync(true);

        _refreshTokenRepositoriesMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.RefreshTokenAsync(ValidToken);

        // Assert
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBe(ValidToken, "new token should be different from old token");

        // Verify interactions
        _refreshTokenRepositoriesMock.Verify(r => r.GetByTokenAsync(ValidToken), Times.Once);
        _userRepositoriesMock.Verify(r => r.GetByIdAsync(ValidUserId), Times.Once);
        _refreshTokenRepositoriesMock.Verify(r => r.RemoveByTokenAsync(oldToken), Times.Once);
        _refreshTokenRepositoriesMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    #endregion

    #region UTCID02: Token Not Exists

    [Fact]
    public async Task RefreshTokenAsync_WithNonExistentToken_ShouldReturnNull()
    {
        // Arrange
        const string nonExistentToken = "nonexistenttoken123456789012345";

        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(nonExistentToken))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _userServices.RefreshTokenAsync(nonExistentToken);

        // Assert
        result.Should().BeNull();

        // Verify no token operations performed
        _userRepositoriesMock.Verify(r => r.GetByIdAsync(It.IsAny<string>()), Times.Never);
        _refreshTokenRepositoriesMock.Verify(r => r.RemoveByTokenAsync(It.IsAny<RefreshToken>()), Times.Never);
        _refreshTokenRepositoriesMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    #endregion

    #region UTCID03: Token Expired

    [Fact]
    public async Task RefreshTokenAsync_WithExpiredToken_ShouldReturnNull()
    {
        // Arrange
        var expiredToken = CreateRefreshToken(ValidToken, ValidUserId, isExpired: true, isRevoked: false);

        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(ValidToken))
            .ReturnsAsync(expiredToken);

        // Act
        var result = await _userServices.RefreshTokenAsync(ValidToken);

        // Assert
        result.Should().BeNull();

        // Verify no further operations
        _userRepositoriesMock.Verify(r => r.GetByIdAsync(It.IsAny<string>()), Times.Never);
        _refreshTokenRepositoriesMock.Verify(r => r.RemoveByTokenAsync(It.IsAny<RefreshToken>()), Times.Never);
    }

    #endregion

    #region UTCID04: Token Revoked

    [Fact]
    public async Task RefreshTokenAsync_WithRevokedToken_ShouldReturnNull()
    {
        // Arrange
        var revokedToken = CreateRefreshToken(ValidToken, ValidUserId, isExpired: false, isRevoked: true);

        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(ValidToken))
            .ReturnsAsync(revokedToken);

        // Act
        var result = await _userServices.RefreshTokenAsync(ValidToken);

        // Assert
        result.Should().BeNull();

        // Verify token was found but no further operations
        _refreshTokenRepositoriesMock.Verify(r => r.GetByTokenAsync(ValidToken), Times.Once);
        _userRepositoriesMock.Verify(r => r.GetByIdAsync(It.IsAny<string>()), Times.Never);
    }

    #endregion

    #region UTCID05: Token Valid - User Not Found

    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_UserNotFound_ShouldReturnNull()
    {
        // Arrange
        var validToken = CreateRefreshToken(ValidToken, ValidUserId, isExpired: false, isRevoked: false);

        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(ValidToken))
            .ReturnsAsync(validToken);

        _userRepositoriesMock
            .Setup(r => r.GetByIdAsync(ValidUserId))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userServices.RefreshTokenAsync(ValidToken);

        // Assert
        result.Should().BeNull();

        // Verify token checked but no new token created
        _refreshTokenRepositoriesMock.Verify(r => r.GetByTokenAsync(ValidToken), Times.Once);
        _userRepositoriesMock.Verify(r => r.GetByIdAsync(ValidUserId), Times.Once);
        _refreshTokenRepositoriesMock.Verify(r => r.RemoveByTokenAsync(It.IsAny<RefreshToken>()), Times.Never);
        _refreshTokenRepositoriesMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
    }

    #endregion

    #region UTCID06: Empty Token

    [Fact]
    public async Task RefreshTokenAsync_WithEmptyToken_ShouldReturnNull()
    {
        // Arrange
        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(""))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _userServices.RefreshTokenAsync("");

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region UTCID07: Null Token

    [Fact]
    public async Task RefreshTokenAsync_WithNullToken_ShouldReturnNull()
    {
        // Arrange
        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(null!))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _userServices.RefreshTokenAsync(null!);

        // Assert
        result.Should().BeNull();
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
