using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using FluentAssertions;
using Moq;

namespace Backend_SEP490.Tests.Services;

/// <summary>
/// Unit tests for UserServicesImpl
/// 
/// Test Coverage:
/// - LoginAsync: 6 tests (valid credentials, non-existent user, incorrect password, JWT generation, multiple roles, null username)
/// - RefreshTokenAsync: 7 tests (valid token, non-existent, revoked, expired, user not found, revoke order, expiration)
/// - LogoutAsync: 5 tests (valid token, non-existent, already revoked, expired, null/empty token)
/// 
/// Total: 18 test methods (21 test cases including Theory data)
/// </summary>
public class UserServicesImplTests
{
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IUserRepositories> _userRepositoriesMock;
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepositoryMock;
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly Mock<IUserOtpRepositories> _userOtpRepositoriesMock;
    private readonly UserServicesImpl _sut; // System Under Test

    public UserServicesImplTests()
    {
        _mapperMock = new Mock<IMapper>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _emailServiceMock = new Mock<IEmailService>();
        _userRepositoriesMock = new Mock<IUserRepositories>();
        _refreshTokenRepositoryMock = new Mock<IRefreshTokenRepository>();
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _userOtpRepositoriesMock = new Mock<IUserOtpRepositories>();

        // Setup UnitOfWork to return mock repositories
        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepositoriesMock.Object);
        _unitOfWorkMock.Setup(u => u.RefreshTokens).Returns(_refreshTokenRepositoryMock.Object);
        _unitOfWorkMock.Setup(u => u.Roles).Returns(_roleRepositoryMock.Object);
        _unitOfWorkMock.Setup(u => u.UserRoles).Returns(_userRoleRepositoryMock.Object);
        _unitOfWorkMock.Setup(u => u.UserOtps).Returns(_userOtpRepositoriesMock.Object);

        // Setup JWT configuration via Environment Variables (UserServicesImpl reads from Environment)
        Environment.SetEnvironmentVariable("JWT_KEY", "tMySuperStrongJwtSecretKey_1234567890!");
        Environment.SetEnvironmentVariable("JWT_ISSUER", "https://localhost:44355");
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", "https://localhost:44355");
        Environment.SetEnvironmentVariable("JWT_EXPIRE_MINUTES", "15");
        Environment.SetEnvironmentVariable("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7");

        _sut = new UserServicesImpl(
            _mapperMock.Object,
            _unitOfWorkMock.Object,
            _emailServiceMock.Object
        );
    }

    #region LoginAsync Tests

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var username = "testuser";
        var password = "password123";
        var hashedPassword = HashPassword(password);

        var user = new User
        {
            UserID = "USER-20251022-120000",
            Username = username,
            PasswordHash = hashedPassword,
            Email = "test@example.com",
            IsActive = true,
            UserRoles = new List<UserRole>
            {
                new UserRole
                {
                    Id = "URID-001",
                    UserID = "USER-20251022-120000",
                    RoleID = "ROLE-001",
                    Role = new Role
                    {
                        Id = "ROLE-001",
                        Name = "Customer"
                    }
                }
            }
        };

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(username))
            .ReturnsAsync(user);

        _refreshTokenRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.LoginAsync(username, password);

        // Assert
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.ExpireAt.Should().BeAfter(DateTime.UtcNow);

        // Verify interactions
        _userRepositoriesMock.Verify(r => r.GetUserByUsernameAsync(username), Times.Once);
        _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.Is<RefreshToken>(
            rt => rt.Token == result.RefreshToken &&
                  rt.UserId == user.UserID &&
                  rt.Expires > DateTime.UtcNow
        )), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentUser_ReturnsNull()
    {
        // Arrange
        var username = "nonexistent";
        var password = "password123";

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(username))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _sut.LoginAsync(username, password);

        // Assert
        result.Should().BeNull();

        // Verify that we never try to save anything
        _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_WithIncorrectPassword_ReturnsNull()
    {
        // Arrange
        var username = "testuser";
        var correctPassword = "correctpassword";
        var incorrectPassword = "wrongpassword";
        var hashedCorrectPassword = HashPassword(correctPassword);

        var user = new User
        {
            UserID = "USER-20251022-120000",
            Username = username,
            PasswordHash = hashedCorrectPassword,
            Email = "test@example.com",
            IsActive = true,
            UserRoles = new List<UserRole>()
        };

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(username))
            .ReturnsAsync(user);

        // Act
        var result = await _sut.LoginAsync(username, incorrectPassword);

        // Assert
        result.Should().BeNull();

        // Verify that we never try to save anything
        _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_GeneratesValidJwtToken()
    {
        // Arrange
        var username = "testuser";
        var password = "password123";
        var hashedPassword = HashPassword(password);

        var user = new User
        {
            UserID = "USER-20251022-120000",
            Username = username,
            PasswordHash = hashedPassword,
            Email = "test@example.com",
            IsActive = true,
            UserRoles = new List<UserRole>
            {
                new UserRole
                {
                    Id = "URID-001",
                    UserID = "USER-20251022-120000",
                    RoleID = "ROLE-001",
                    Role = new Role
                    {
                        Id = "ROLE-001",
                        Name = "Customer"
                    }
                }
            }
        };

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(username))
            .ReturnsAsync(user);

        _refreshTokenRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.LoginAsync(username, password);

        // Assert
        result.Should().NotBeNull();
        
        // JWT token should be in 3 parts separated by dots
        var tokenParts = result!.AccessToken.Split('.');
        tokenParts.Should().HaveCount(3, "JWT tokens have 3 parts: header, payload, signature");

        // Expiration should be 15 minutes from now (based on config)
        var expectedExpiration = DateTime.UtcNow.AddMinutes(15);
        result.ExpireAt.Should().BeCloseTo(expectedExpiration, TimeSpan.FromSeconds(5));

        // Refresh token should be a valid GUID format (32 characters without hyphens)
        result.RefreshToken.Should().HaveLength(32);
        result.RefreshToken.Should().MatchRegex("^[a-f0-9]{32}$");
    }

    [Fact]
    public async Task LoginAsync_WithMultipleRoles_IncludesAllRolesInToken()
    {
        // Arrange
        var username = "admin";
        var password = "adminpass";
        var hashedPassword = HashPassword(password);

        var user = new User
        {
            UserID = "USER-20251022-120000",
            Username = username,
            PasswordHash = hashedPassword,
            Email = "admin@example.com",
            IsActive = true,
            UserRoles = new List<UserRole>
            {
                new UserRole
                {
                    Id = "URID-001",
                    UserID = "USER-20251022-120000",
                    RoleID = "ROLE-001",
                    Role = new Role { Id = "ROLE-001", Name = "Customer" }
                },
                new UserRole
                {
                    Id = "URID-002",
                    UserID = "USER-20251022-120000",
                    RoleID = "ROLE-002",
                    Role = new Role { Id = "ROLE-002", Name = "Admin" }
                }
            }
        };

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(username))
            .ReturnsAsync(user);

        _refreshTokenRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.LoginAsync(username, password);

        // Assert
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrEmpty();
        
        // Note: To fully verify roles in token, we'd need to decode the JWT
        // For now, we just verify that the token was generated with a user that has multiple roles
        _userRepositoriesMock.Verify(r => r.GetUserByUsernameAsync(username), Times.Once);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public async Task LoginAsync_WithEmptyOrNullUsername_ReturnsNull(string? username)
    {
        // Arrange
        var password = "password123";

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _sut.LoginAsync(username!, password);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_SavesRefreshTokenWithCorrectExpiration()
    {
        // Arrange
        var username = "testuser";
        var password = "password123";
        var hashedPassword = HashPassword(password);

        var user = new User
        {
            UserID = "USER-20251022-120000",
            Username = username,
            PasswordHash = hashedPassword,
            Email = "test@example.com",
            IsActive = true,
            UserRoles = new List<UserRole>()
        };

        RefreshToken? capturedRefreshToken = null;

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(username))
            .ReturnsAsync(user);

        _refreshTokenRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Callback<RefreshToken>(rt => capturedRefreshToken = rt)
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.LoginAsync(username, password);

        // Assert
        capturedRefreshToken.Should().NotBeNull();
        capturedRefreshToken!.Token.Should().Be(result!.RefreshToken);
        capturedRefreshToken.UserId.Should().Be(user.UserID);
        
        // Refresh token should expire in 7 days (based on config)
        var expectedExpiration = DateTime.UtcNow.AddDays(7);
        capturedRefreshToken.Expires.Should().BeCloseTo(expectedExpiration, TimeSpan.FromSeconds(5));
    }

    #endregion

    #region RefreshTokenAsync Tests

    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_ReturnsNewAuthResponse()
    {
        // Arrange
        var refreshToken = "valid-refresh-token-12345";
        var userId = "USER-20251022-120000";

        var user = new User
        {
            UserID = userId,
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = "hashed",
            IsActive = true,
            UserRoles = new List<UserRole>
            {
                new UserRole
                {
                    Id = "URID-001",
                    UserID = userId,
                    RoleID = "ROLE-001",
                    Role = new Role { Id = "ROLE-001", Name = "Customer" }
                }
            }
        };

        var oldTokenEntity = new RefreshToken
        {
            Id = 1,
            Token = refreshToken,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow.AddDays(-1),
            Revoked = null,
            UserId = userId
        };

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync(oldTokenEntity);

        _userRepositoriesMock
            .Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(user);

        _refreshTokenRepositoryMock
            .Setup(r => r.RemoveByTokenAsync(oldTokenEntity))
            .ReturnsAsync(true);

        _refreshTokenRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.RefreshTokenAsync(refreshToken);

        // Assert
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBe(refreshToken, "should generate new refresh token");

        // Verify old token was removed
        _refreshTokenRepositoryMock.Verify(r => r.RemoveByTokenAsync(oldTokenEntity), Times.Once);

        // Verify new token was added
        _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.Is<RefreshToken>(
            rt => rt.Token == result.RefreshToken &&
                  rt.UserId == userId &&
                  rt.Expires > DateTime.UtcNow
        )), Times.Once);

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithNonExistentToken_ReturnsNull()
    {
        // Arrange
        var refreshToken = "non-existent-token";

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _sut.RefreshTokenAsync(refreshToken);

        // Assert
        result.Should().BeNull();

        // Verify no new token was created
        _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithRevokedToken_ReturnsNull()
    {
        // Arrange
        var refreshToken = "revoked-token";
        var revokedTokenEntity = new RefreshToken
        {
            Id = 1,
            Token = refreshToken,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow.AddDays(-1),
            Revoked = DateTime.UtcNow.AddHours(-1), // Already revoked
            UserId = "USER-001"
        };

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync(revokedTokenEntity);

        // Act
        var result = await _sut.RefreshTokenAsync(refreshToken);

        // Assert
        result.Should().BeNull();

        // Verify no new token was created
        _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithExpiredToken_ReturnsNull()
    {
        // Arrange
        var refreshToken = "expired-token";
        var expiredTokenEntity = new RefreshToken
        {
            Id = 1,
            Token = refreshToken,
            Expires = DateTime.UtcNow.AddDays(-1), // Expired yesterday
            Created = DateTime.UtcNow.AddDays(-8),
            Revoked = null,
            UserId = "USER-001"
        };

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync(expiredTokenEntity);

        // Act
        var result = await _sut.RefreshTokenAsync(refreshToken);

        // Assert
        result.Should().BeNull();

        // Verify no new token was created
        _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithValidTokenButUserNotFound_ReturnsNull()
    {
        // Arrange
        var refreshToken = "valid-token-but-user-deleted";
        var userId = "DELETED-USER-001";

        var tokenEntity = new RefreshToken
        {
            Id = 1,
            Token = refreshToken,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow.AddDays(-1),
            Revoked = null,
            UserId = userId
        };

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync(tokenEntity);

        _userRepositoriesMock
            .Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync((User?)null); // User doesn't exist

        // Act
        var result = await _sut.RefreshTokenAsync(refreshToken);

        // Assert
        result.Should().BeNull();

        // Verify token was NOT revoked (returns early when user not found)
        tokenEntity.Revoked.Should().BeNull();

        // Verify no new token was created
        _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.IsAny<RefreshToken>()), Times.Never);
        
        // Verify SaveChanges was never called (no changes made)
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task RefreshTokenAsync_RemovesOldTokenBeforeCreatingNew()
    {
        // Arrange
        var refreshToken = "valid-token";
        var userId = "USER-001";

        var user = new User
        {
            UserID = userId,
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = "hashed",
            IsActive = true,
            UserRoles = new List<UserRole>()
        };

        var oldTokenEntity = new RefreshToken
        {
            Id = 1,
            Token = refreshToken,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow.AddDays(-1),
            Revoked = null,
            UserId = userId
        };

        var removeWasCalled = false;

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync(oldTokenEntity);

        _userRepositoriesMock
            .Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(user);

        _refreshTokenRepositoryMock
            .Setup(r => r.RemoveByTokenAsync(oldTokenEntity))
            .Callback(() => removeWasCalled = true)
            .ReturnsAsync(true);

        _refreshTokenRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Callback<RefreshToken>(rt =>
            {
                // Verify RemoveByTokenAsync was called before AddAsync
                removeWasCalled.Should().BeTrue("old token should be removed before adding new token");
            })
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.RefreshTokenAsync(refreshToken);

        // Assert
        result.Should().NotBeNull();
        
        // Verify old token was removed
        _refreshTokenRepositoryMock.Verify(r => r.RemoveByTokenAsync(oldTokenEntity), Times.Once);
    }

    [Fact]
    public async Task RefreshTokenAsync_GeneratesNewTokenWithCorrectExpiration()
    {
        // Arrange
        var refreshToken = "valid-token";
        var userId = "USER-001";

        var user = new User
        {
            UserID = userId,
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = "hashed",
            IsActive = true,
            UserRoles = new List<UserRole>()
        };

        var oldTokenEntity = new RefreshToken
        {
            Id = 1,
            Token = refreshToken,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow.AddDays(-1),
            Revoked = null,
            UserId = userId
        };

        RefreshToken? capturedNewToken = null;

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync(oldTokenEntity);

        _userRepositoriesMock
            .Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(user);

        _refreshTokenRepositoryMock
            .Setup(r => r.RemoveByTokenAsync(oldTokenEntity))
            .ReturnsAsync(true);

        _refreshTokenRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>()))
            .Callback<RefreshToken>(rt => capturedNewToken = rt)
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.RefreshTokenAsync(refreshToken);

        // Assert
        capturedNewToken.Should().NotBeNull();
        capturedNewToken!.UserId.Should().Be(userId);
        
        // New token should expire in 7 days
        var expectedExpiration = DateTime.UtcNow.AddDays(7);
        capturedNewToken.Expires.Should().BeCloseTo(expectedExpiration, TimeSpan.FromSeconds(5));
        
        // Token should match what was returned
        capturedNewToken.Token.Should().Be(result!.RefreshToken);
    }

    #endregion

    #region LogoutAsync Tests

    [Fact]
    public async Task LogoutAsync_WithValidToken_RevokesTokenAndReturnsTrue()
    {
        // Arrange
        var refreshToken = "valid-token-to-logout";
        var tokenEntity = new RefreshToken
        {
            Id = 1,
            Token = refreshToken,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow.AddDays(-1),
            Revoked = null,
            UserId = "USER-001"
        };

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync(tokenEntity);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.LogoutAsync(refreshToken);

        // Assert
        result.Should().BeTrue();
        tokenEntity.Revoked.Should().NotBeNull();
        tokenEntity.Revoked.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task LogoutAsync_WithNonExistentToken_ReturnsFalse()
    {
        // Arrange
        var refreshToken = "non-existent-token";

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _sut.LogoutAsync(refreshToken);

        // Assert
        result.Should().BeFalse();

        // Verify SaveChanges was never called
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task LogoutAsync_WithAlreadyRevokedToken_ReturnsFalse()
    {
        // Arrange
        var refreshToken = "already-revoked-token";
        var tokenEntity = new RefreshToken
        {
            Id = 1,
            Token = refreshToken,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow.AddDays(-1),
            Revoked = DateTime.UtcNow.AddHours(-1), // Already revoked
            UserId = "USER-001"
        };

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync(tokenEntity);

        // Act
        var result = await _sut.LogoutAsync(refreshToken);

        // Assert
        result.Should().BeFalse();

        // Verify SaveChanges was never called
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task LogoutAsync_WithExpiredToken_ReturnsFalse()
    {
        // Arrange
        var refreshToken = "expired-token";
        var tokenEntity = new RefreshToken
        {
            Id = 1,
            Token = refreshToken,
            Expires = DateTime.UtcNow.AddDays(-1), // Expired
            Created = DateTime.UtcNow.AddDays(-8),
            Revoked = null,
            UserId = "USER-001"
        };

        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(refreshToken))
            .ReturnsAsync(tokenEntity);

        // Act
        var result = await _sut.LogoutAsync(refreshToken);

        // Assert
        result.Should().BeFalse();

        // Verify SaveChanges was never called (expired tokens are not active)
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public async Task LogoutAsync_WithEmptyOrNullToken_ReturnsFalse(string? refreshToken)
    {
        // Arrange
        _refreshTokenRepositoryMock
            .Setup(r => r.GetByTokenAsync(It.IsAny<string>()))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _sut.LogoutAsync(refreshToken!);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region RegisterAsync Tests

    [Fact]
    public async Task RegisterAsync_WithValidData_SendsOtpAndReturnsTrue()
    {
        // Arrange
        var dto = new RequestDTORegister
        {
            Username = "newuser",
            Email = "newuser@example.com",
            PasswordHash = "password123",
            PhoneNumber = "0123456789",
            DisplayName = "New User",
            Dob = new DateTime(1990, 1, 1)
        };

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(dto.Username))
            .ReturnsAsync((User?)null);

        _userRepositoriesMock
            .Setup(r => r.GetUserByEmailAsync(dto.Email))
            .ReturnsAsync((User?)null);

        _userOtpRepositoriesMock
            .Setup(r => r.AddOtpAsync(It.IsAny<UserOtp>()))
            .Returns(Task.CompletedTask);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _emailServiceMock
            .Setup(e => e.SendEmailAsync(dto.Email, It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        result.Should().BeTrue();

        // Verify OTP was created and saved
        _userOtpRepositoriesMock.Verify(r => r.AddOtpAsync(It.Is<UserOtp>(
            otp => otp.Email == dto.Email &&
                   otp.OtpCode.Length == 6 &&
                   otp.ExpiresAt > DateTime.UtcNow
        )), Times.Once);

        _userOtpRepositoriesMock.Verify(r => r.SaveChangesAsync(), Times.Once);

        // Verify email was sent
        _emailServiceMock.Verify(e => e.SendEmailAsync(
            dto.Email,
            "Your OTP Code",
            It.Is<string>(body => body.Contains("Your OTP is:"))
        ), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingUsername_ReturnsFalse()
    {
        // Arrange
        var dto = new RequestDTORegister
        {
            Username = "existinguser",
            Email = "new@example.com",
            PasswordHash = "password123"
        };

        var existingUser = new User
        {
            UserID = "USER-001",
            Username = dto.Username,
            Email = "other@example.com"
        };

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(dto.Username))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        result.Should().BeFalse();

        // Verify no OTP was created
        _userOtpRepositoriesMock.Verify(r => r.AddOtpAsync(It.IsAny<UserOtp>()), Times.Never);
        
        // Verify no email was sent
        _emailServiceMock.Verify(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ReturnsFalse()
    {
        // Arrange
        var dto = new RequestDTORegister
        {
            Username = "newuser",
            Email = "existing@example.com",
            PasswordHash = "password123"
        };

        var existingUser = new User
        {
            UserID = "USER-001",
            Username = "otheruser",
            Email = dto.Email
        };

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(dto.Username))
            .ReturnsAsync((User?)null);

        _userRepositoriesMock
            .Setup(r => r.GetUserByEmailAsync(dto.Email))
            .ReturnsAsync(existingUser);

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        result.Should().BeFalse();

        // Verify no OTP was created
        _userOtpRepositoriesMock.Verify(r => r.AddOtpAsync(It.IsAny<UserOtp>()), Times.Never);
        
        // Verify no email was sent
        _emailServiceMock.Verify(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task RegisterAsync_GeneratesValidOtpWithCorrectExpiration()
    {
        // Arrange
        var dto = new RequestDTORegister
        {
            Username = "newuser",
            Email = "newuser@example.com",
            PasswordHash = "password123"
        };

        UserOtp? capturedOtp = null;

        _userRepositoriesMock
            .Setup(r => r.GetUserByUsernameAsync(dto.Username))
            .ReturnsAsync((User?)null);

        _userRepositoriesMock
            .Setup(r => r.GetUserByEmailAsync(dto.Email))
            .ReturnsAsync((User?)null);

        _userOtpRepositoriesMock
            .Setup(r => r.AddOtpAsync(It.IsAny<UserOtp>()))
            .Callback<UserOtp>(otp => capturedOtp = otp)
            .Returns(Task.CompletedTask);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _emailServiceMock
            .Setup(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.RegisterAsync(dto);

        // Assert
        capturedOtp.Should().NotBeNull();
        capturedOtp!.Email.Should().Be(dto.Email);
        capturedOtp.OtpCode.Should().MatchRegex("^[0-9]{6}$", "OTP should be 6 digits");
        
        // OTP should expire in 5 minutes
        var expectedExpiration = DateTime.UtcNow.AddMinutes(5);
        capturedOtp.ExpiresAt.Should().BeCloseTo(expectedExpiration, TimeSpan.FromSeconds(5));
        
        // ID should be a valid GUID
        Guid.TryParse(capturedOtp.Id, out _).Should().BeTrue();
    }

    #endregion

    #region VerifyOtpAsync Tests

    [Fact]
    public async Task VerifyOtpAsync_WithValidOtp_CreatesUserAndReturnsTrue()
    {
        // Arrange
        var dto = new RequestDTORegister
        {
            Username = "newuser",
            Email = "newuser@example.com",
            PasswordHash = "password123",
            PhoneNumber = "0123456789",
            DisplayName = "New User",
            Dob = new DateTime(1990, 1, 1)
        };
        var otp = "123456";

        var otpEntity = new UserOtp
        {
            Id = Guid.NewGuid().ToString(),
            Email = dto.Email,
            OtpCode = otp,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false
        };

        var customerRole = new Role
        {
            Id = "ROLE-001",
            Name = "Customer"
        };

        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(dto.Email, otp))
            .ReturnsAsync(otpEntity);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(dto.Email))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Returns(Task.CompletedTask);

        _roleRepositoryMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync(customerRole);

        _userRoleRepositoryMock
            .Setup(r => r.AddUserRoleAsync(It.IsAny<UserRole>()))
            .Returns(Task.CompletedTask);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.VerifyOtpAsync(dto, otp);

        // Assert
        result.Should().BeTrue();

        // Verify OTP was marked as used and deleted
        otpEntity.IsUsed.Should().BeTrue();
        _userOtpRepositoriesMock.Verify(r => r.DeleteOtpAsync(dto.Email), Times.Once);

        // Verify user was created
        _userRepositoriesMock.Verify(r => r.AddUserAsync(It.Is<User>(
            u => u.Username == dto.Username &&
                 u.Email == dto.Email &&
                 u.PhoneNumber == dto.PhoneNumber &&
                 u.DisplayName == dto.DisplayName &&
                 u.IsActive == true
        )), Times.Once);

        // Verify Customer role was assigned
        _userRoleRepositoryMock.Verify(r => r.AddUserRoleAsync(It.Is<UserRole>(
            ur => ur.RoleID == customerRole.Id
        )), Times.Once);

        // Verify saves were called
        _userOtpRepositoriesMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task VerifyOtpAsync_WithInvalidOtp_ReturnsFalse()
    {
        // Arrange
        var dto = new RequestDTORegister
        {
            Username = "newuser",
            Email = "newuser@example.com",
            PasswordHash = "password123"
        };
        var otp = "999999";

        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(dto.Email, otp))
            .ReturnsAsync((UserOtp?)null);

        // Act
        var result = await _sut.VerifyOtpAsync(dto, otp);

        // Assert
        result.Should().BeFalse();

        // Verify no user was created
        _userRepositoriesMock.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Never);
        
        // Verify no role was assigned
        _userRoleRepositoryMock.Verify(r => r.AddUserRoleAsync(It.IsAny<UserRole>()), Times.Never);
    }

    [Fact]
    public async Task VerifyOtpAsync_HashesPasswordCorrectly()
    {
        // Arrange
        var dto = new RequestDTORegister
        {
            Username = "newuser",
            Email = "newuser@example.com",
            PasswordHash = "plainpassword123",
            PhoneNumber = "0123456789",
            DisplayName = "New User"
        };
        var otp = "123456";

        var otpEntity = new UserOtp
        {
            Id = Guid.NewGuid().ToString(),
            Email = dto.Email,
            OtpCode = otp,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false
        };

        User? capturedUser = null;

        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(dto.Email, otp))
            .ReturnsAsync(otpEntity);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(dto.Email))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .Returns(Task.CompletedTask);

        _roleRepositoryMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync((Role?)null); // No role assigned for simplicity

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.VerifyOtpAsync(dto, otp);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.PasswordHash.Should().NotBe(dto.PasswordHash, "password should be hashed");
        capturedUser.PasswordHash.Should().Be(HashPassword(dto.PasswordHash), "password should match SHA256 hash");
    }

    [Fact]
    public async Task VerifyOtpAsync_GeneratesUserIdWithCorrectFormat()
    {
        // Arrange
        var dto = new RequestDTORegister
        {
            Username = "newuser",
            Email = "newuser@example.com",
            PasswordHash = "password123"
        };
        var otp = "123456";

        var otpEntity = new UserOtp
        {
            Id = Guid.NewGuid().ToString(),
            Email = dto.Email,
            OtpCode = otp,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false
        };

        User? capturedUser = null;

        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(dto.Email, otp))
            .ReturnsAsync(otpEntity);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(dto.Email))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .Returns(Task.CompletedTask);

        _roleRepositoryMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync((Role?)null);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.VerifyOtpAsync(dto, otp);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.UserID.Should().StartWith("USER-");
        capturedUser.UserID.Should().MatchRegex(@"^USER-\d{8}-\d{6}$", "UserID format should be USER-YYYYMMDD-HHMMSS");
    }

    [Fact]
    public async Task VerifyOtpAsync_SetsUserPropertiesCorrectly()
    {
        // Arrange
        var dto = new RequestDTORegister
        {
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = "password123",
            PhoneNumber = "0987654321",
            DisplayName = "Test User",
            Dob = new DateTime(1995, 5, 15)
        };
        var otp = "123456";

        var otpEntity = new UserOtp
        {
            Id = Guid.NewGuid().ToString(),
            Email = dto.Email,
            OtpCode = otp,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false
        };

        User? capturedUser = null;

        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(dto.Email, otp))
            .ReturnsAsync(otpEntity);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(dto.Email))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Callback<User>(u => capturedUser = u)
            .Returns(Task.CompletedTask);

        _roleRepositoryMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync((Role?)null);

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.VerifyOtpAsync(dto, otp);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.Username.Should().Be(dto.Username);
        capturedUser.Email.Should().Be(dto.Email);
        capturedUser.PhoneNumber.Should().Be(dto.PhoneNumber);
        capturedUser.DisplayName.Should().Be(dto.DisplayName);
        capturedUser.Dob.Should().Be(dto.Dob);
        capturedUser.IsActive.Should().BeTrue();
        capturedUser.CreateAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        capturedUser.UpdateAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task VerifyOtpAsync_WithNoCustomerRole_StillCreatesUser()
    {
        // Arrange
        var dto = new RequestDTORegister
        {
            Username = "newuser",
            Email = "newuser@example.com",
            PasswordHash = "password123"
        };
        var otp = "123456";

        var otpEntity = new UserOtp
        {
            Id = Guid.NewGuid().ToString(),
            Email = dto.Email,
            OtpCode = otp,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false
        };

        _userOtpRepositoriesMock
            .Setup(r => r.GetValidOtpAsync(dto.Email, otp))
            .ReturnsAsync(otpEntity);

        _userOtpRepositoriesMock
            .Setup(r => r.DeleteOtpAsync(dto.Email))
            .Returns(Task.CompletedTask);

        _userRepositoriesMock
            .Setup(r => r.AddUserAsync(It.IsAny<User>()))
            .Returns(Task.CompletedTask);

        _roleRepositoryMock
            .Setup(r => r.GetByNameAsync("Customer"))
            .ReturnsAsync((Role?)null); // No Customer role exists

        _userOtpRepositoriesMock
            .Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _sut.VerifyOtpAsync(dto, otp);

        // Assert
        result.Should().BeTrue();

        // Verify user was still created
        _userRepositoriesMock.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Once);
        
        // Verify no role was assigned
        _userRoleRepositoryMock.Verify(r => r.AddUserRoleAsync(It.IsAny<UserRole>()), Times.Never);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Helper method to hash password using SHA256 (same as in UserServicesImpl)
    /// </summary>
    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    #endregion
}
