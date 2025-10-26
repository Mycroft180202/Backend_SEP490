using AutoMapper;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using FluentAssertions;
using Moq;

namespace Backend_SEP490.Tests.Services;

/// <summary>
/// Unit tests cho LogoutAsync method trong UserServicesImpl
/// Test các trường hợp: Token Active, Token Revoked, Token Expired, Token Not Exists
/// </summary>
public class UserServicesLogoutTests : IDisposable
{
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepositoriesMock;
    private readonly UserServicesImpl _userServices;

    // Test data constants
    private const string ValidToken = "validtoken123456789012345678901234";
    private const string ValidUserId = "USER-20251026-120000";

    public UserServicesLogoutTests()
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
        _refreshTokenRepositoriesMock = new Mock<IRefreshTokenRepository>();

        // Setup UnitOfWork to return mocked repositories
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
    /// Create a refresh token
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

    #region UTCID01: Token Active

    [Fact]
    public async Task LogoutAsync_WithActiveToken_ShouldReturnTrue()
    {
        // Arrange
        var activeToken = CreateRefreshToken(ValidToken, ValidUserId, isExpired: false, isRevoked: false);

        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(ValidToken))
            .ReturnsAsync(activeToken);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _userServices.LogoutAsync(ValidToken);

        // Assert
        result.Should().BeTrue();
        activeToken.Revoked.Should().NotBeNull();
        activeToken.Revoked.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));

        // Verify interactions
        _refreshTokenRepositoriesMock.Verify(r => r.GetByTokenAsync(ValidToken), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    #endregion

    #region UTCID02: Token Not Exists

    [Fact]
    public async Task LogoutAsync_WithNonExistentToken_ShouldReturnFalse()
    {
        // Arrange
        const string nonExistentToken = "nonexistenttoken123456789012345";

        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(nonExistentToken))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _userServices.LogoutAsync(nonExistentToken);

        // Assert
        result.Should().BeFalse();

        // Verify no save operation
        _refreshTokenRepositoriesMock.Verify(r => r.GetByTokenAsync(nonExistentToken), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    #endregion

    #region UTCID03: Token Already Revoked

    [Fact]
    public async Task LogoutAsync_WithRevokedToken_ShouldReturnFalse()
    {
        // Arrange
        var revokedToken = CreateRefreshToken(ValidToken, ValidUserId, isExpired: false, isRevoked: true);

        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(ValidToken))
            .ReturnsAsync(revokedToken);

        // Act
        var result = await _userServices.LogoutAsync(ValidToken);

        // Assert
        result.Should().BeFalse();

        // Verify no save operation
        _refreshTokenRepositoriesMock.Verify(r => r.GetByTokenAsync(ValidToken), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    #endregion

    #region UTCID04: Token Expired

    [Fact]
    public async Task LogoutAsync_WithExpiredToken_ShouldReturnFalse()
    {
        // Arrange
        var expiredToken = CreateRefreshToken(ValidToken, ValidUserId, isExpired: true, isRevoked: false);

        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(ValidToken))
            .ReturnsAsync(expiredToken);

        // Act
        var result = await _userServices.LogoutAsync(ValidToken);

        // Assert
        result.Should().BeFalse();

        // Verify no save operation
        _refreshTokenRepositoriesMock.Verify(r => r.GetByTokenAsync(ValidToken), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    #endregion

    #region UTCID05: Empty Token

    [Fact]
    public async Task LogoutAsync_WithEmptyToken_ShouldReturnFalse()
    {
        // Arrange
        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(""))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _userServices.LogoutAsync("");

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region UTCID06: Null Token

    [Fact]
    public async Task LogoutAsync_WithNullToken_ShouldReturnFalse()
    {
        // Arrange
        _refreshTokenRepositoriesMock
            .Setup(r => r.GetByTokenAsync(null!))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _userServices.LogoutAsync(null!);

        // Assert
        result.Should().BeFalse();
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
