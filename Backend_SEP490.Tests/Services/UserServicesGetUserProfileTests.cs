using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using FluentAssertions;
using Moq;

namespace Backend_SEP490.Tests.Services;

/// <summary>
/// Unit tests for GetUserByIDAsync method in UserServicesImpl
/// Tests cover the GET /api/User/users/me endpoint (Get User Profile)
/// Total: 12 test cases ensuring comprehensive coverage of profile retrieval scenarios
/// </summary>
public class UserServicesGetUserProfileTests : IDisposable
{
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IUserRepositories> _userRepositoriesMock;
    private readonly UserServicesImpl _userServices;

    // Test data constants
    private const string ValidUserId = "USER-20251027-120000";
    private const string InvalidUserId = "INVALID-FORMAT-123";
    private const string NonExistentUserId = "USER-99999999-999999";
    private const string ValidUsername = "testuser";
    private const string ValidEmail = "test@example.com";
    private const string ValidDisplayName = "Test User";

    public UserServicesGetUserProfileTests()
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

        // Setup UnitOfWork to return mocked repositories
        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepositoriesMock.Object);

        // Create service instance
        _userServices = new UserServicesImpl(
            _mapperMock.Object,
            _unitOfWorkMock.Object,
            _emailServiceMock.Object
        );
    }

    #region Helper Methods

    /// <summary>
    /// Create a valid test user with all fields populated
    /// </summary>
    private User CreateTestUser(
        string userId,
        string username,
        string email,
        bool isActive = true,
        string? phoneNumber = null,
        string? displayName = null,
        DateTime? dob = null,
        string? userUrlImage = null)
    {
        return new User
        {
            UserID = userId,
            Username = username,
            Email = email,
            PasswordHash = "HashedPassword123",
            IsActive = isActive,
            CreateAt = DateTime.UtcNow.AddDays(-30),
            UpdateAt = DateTime.UtcNow,
            PhoneNumber = phoneNumber,
            DisplayName = displayName,
            Dob = dob,
            UserUrlImage = userUrlImage,
            ShopName = null,
            Bio = null,
            Rating = null,
            AdminLevel = null,
            ShopUrlImage = null,
            UserRoles = new List<UserRole>(),
            Addresses = new List<Address>()
        };
    }

    /// <summary>
    /// Create a test role
    /// </summary>
    private Role CreateTestRole(string id, string name, string description)
    {
        return new Role
        {
            Id = id,
            Name = name,
            Description = description
        };
    }

    /// <summary>
    /// Create a test address
    /// </summary>
    private Address CreateTestAddress(
        string addressId,
        string userId,
        string line1,
        string city,
        string country,
        bool isDefault = false)
    {
        return new Address
        {
            Id = addressId,
            UserID = userId,
            Line1 = line1,
            Line2 = null,
            City = city,
            PosttalCode = null,
            Country = country,
            IsDefault = isDefault
        };
    }

    /// <summary>
    /// Create a test ResponseDTOUser
    /// </summary>
    private ResponseDTOUser CreateResponseDTOUser(
        User user,
        List<ResponseDTORole>? roles = null,
        List<ResponseDTOAddress>? addresses = null)
    {
        return new ResponseDTOUser
        {
            UserID = user.UserID,
            Username = user.Username,
            Email = user.Email,
            IsActive = user.IsActive,
            CreateAt = user.CreateAt,
            UpdateAt = user.UpdateAt,
            PhoneNumber = user.PhoneNumber,
            DisplayName = user.DisplayName,
            Dob = user.Dob,
            UserUrlImage = user.UserUrlImage,
            Roles = roles,
            Addresses = addresses
        };
    }

    #endregion

    #region UTCID01: Valid User Profile - Normal Flow

    [Fact]
    public async Task GetUserByIDAsync_WithValidUserId_ShouldReturnCompleteUserProfile()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            isActive: true,
            phoneNumber: "0123456789",
            displayName: ValidDisplayName,
            dob: new DateTime(1990, 5, 15),
            userUrlImage: "https://example.com/user.jpg"
        );

        // Add roles
        var customerRole = CreateTestRole("ROLE-CUSTOMER", "Customer", "Regular customer");
        user.UserRoles = new List<UserRole>
        {
            new UserRole
            {
                Id = $"{ValidUserId}-ROLE-CUSTOMER",
                UserID = ValidUserId,
                RoleID = "ROLE-CUSTOMER",
                Role = customerRole
            }
        };

        // Add addresses
        user.Addresses = new List<Address>
        {
            CreateTestAddress(
                "ADDR-001",
                ValidUserId,
                "123 Main Street",
                "Hanoi",
                "Vietnam",
                isDefault: true
            )
        };

        var expectedResponse = CreateResponseDTOUser(
            user,
            roles: new List<ResponseDTORole>
            {
                new ResponseDTORole { Name = "Customer", Description = "Regular customer" }
            },
            addresses: new List<ResponseDTOAddress>
            {
                new ResponseDTOAddress
                {
                    Line1 = "123 Main Street",
                    City = "Hanoi",
                    Country = "Vietnam",
                    IsDefault = true
                }
            }
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Mapper maps correctly
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(user))
            .Returns(expectedResponse);

        // Act
        var result = await _userServices.GetUserByIDAsync(ValidUserId);

        // Assert
        result.Should().NotBeNull();
        result.UserID.Should().Be(ValidUserId);
        result.Username.Should().Be(ValidUsername);
        result.Email.Should().Be(ValidEmail);
        result.IsActive.Should().BeTrue();
        result.PhoneNumber.Should().Be("0123456789");
        result.DisplayName.Should().Be(ValidDisplayName);
        result.Dob.Should().Be(new DateTime(1990, 5, 15));
        result.UserUrlImage.Should().Be("https://example.com/user.jpg");

        // Verify roles
        result.Roles.Should().NotBeNull();
        result.Roles.Should().HaveCount(1);
        result.Roles![0].Name.Should().Be("Customer");

        // Verify addresses
        result.Addresses.Should().NotBeNull();
        result.Addresses.Should().HaveCount(1);
        result.Addresses![0].Line1.Should().Be("123 Main Street");
        result.Addresses[0].IsDefault.Should().BeTrue();

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _mapperMock.Verify(m => m.Map<ResponseDTOUser>(user), Times.Once);
    }

    #endregion

    #region UTCID02: User Not Exists

    [Fact]
    public async Task GetUserByIDAsync_WithNonExistentUserId_ShouldReturnNull()
    {
        // Arrange
        // Setup: User does not exist
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(NonExistentUserId))
            .ReturnsAsync((User?)null);

        // Setup: Mapper returns null for null input
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(null))
            .Returns((ResponseDTOUser?)null);

        // Act
        var result = await _userServices.GetUserByIDAsync(NonExistentUserId);

        // Assert
        result.Should().BeNull("user does not exist in database");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(NonExistentUserId), Times.Once);
        _mapperMock.Verify(m => m.Map<ResponseDTOUser>(null), Times.Once);
    }

    #endregion

    #region UTCID03: Null UserId from JWT

    [Fact]
    public async Task GetUserByIDAsync_WithNullUserId_ShouldReturnNull()
    {
        // Arrange
        string? nullUserId = null;

        // Setup: Repository returns null for null userId
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(nullUserId!))
            .ReturnsAsync((User?)null);

        // Setup: Mapper returns null
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(null))
            .Returns((ResponseDTOUser?)null);

        // Act
        var result = await _userServices.GetUserByIDAsync(nullUserId!);

        // Assert
        result.Should().BeNull("null userId cannot find any user");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(nullUserId!), Times.Once);
    }

    #endregion

    #region UTCID04: Empty UserId

    [Fact]
    public async Task GetUserByIDAsync_WithEmptyUserId_ShouldReturnNull()
    {
        // Arrange
        var emptyUserId = string.Empty;

        // Setup: Repository returns null for empty userId
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(emptyUserId))
            .ReturnsAsync((User?)null);

        // Setup: Mapper returns null
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(null))
            .Returns((ResponseDTOUser?)null);

        // Act
        var result = await _userServices.GetUserByIDAsync(emptyUserId);

        // Assert
        result.Should().BeNull("empty userId cannot find any user");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(emptyUserId), Times.Once);
    }

    #endregion

    #region UTCID05: Invalid UserId Format

    [Fact]
    public async Task GetUserByIDAsync_WithInvalidUserIdFormat_ShouldReturnNull()
    {
        // Arrange
        // Setup: Repository returns null for invalid format
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(InvalidUserId))
            .ReturnsAsync((User?)null);

        // Setup: Mapper returns null
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(null))
            .Returns((ResponseDTOUser?)null);

        // Act
        var result = await _userServices.GetUserByIDAsync(InvalidUserId);

        // Assert
        result.Should().BeNull("invalid userId format should not find any user");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(InvalidUserId), Times.Once);
    }

    #endregion

    #region UTCID06: User Without Roles

    [Fact]
    public async Task GetUserByIDAsync_WithUserWithoutRoles_ShouldReturnUserWithEmptyRolesList()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);
        user.UserRoles = new List<UserRole>(); // Empty roles

        var expectedResponse = CreateResponseDTOUser(
            user,
            roles: new List<ResponseDTORole>(), // Empty roles list
            addresses: new List<ResponseDTOAddress>()
        );

        // Setup: User exists without roles
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Mapper maps correctly
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(user))
            .Returns(expectedResponse);

        // Act
        var result = await _userServices.GetUserByIDAsync(ValidUserId);

        // Assert
        result.Should().NotBeNull();
        result.UserID.Should().Be(ValidUserId);
        result.Roles.Should().NotBeNull();
        result.Roles.Should().BeEmpty("user has no roles assigned");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
    }

    #endregion

    #region UTCID07: User Without Addresses

    [Fact]
    public async Task GetUserByIDAsync_WithUserWithoutAddresses_ShouldReturnUserWithEmptyAddressesList()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);
        user.Addresses = new List<Address>(); // Empty addresses

        var expectedResponse = CreateResponseDTOUser(
            user,
            roles: new List<ResponseDTORole>(),
            addresses: new List<ResponseDTOAddress>() // Empty addresses list
        );

        // Setup: User exists without addresses
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Mapper maps correctly
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(user))
            .Returns(expectedResponse);

        // Act
        var result = await _userServices.GetUserByIDAsync(ValidUserId);

        // Assert
        result.Should().NotBeNull();
        result.UserID.Should().Be(ValidUserId);
        result.Addresses.Should().NotBeNull();
        result.Addresses.Should().BeEmpty("user has no addresses");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
    }

    #endregion

    #region UTCID08: Inactive User

    [Fact]
    public async Task GetUserByIDAsync_WithInactiveUser_ShouldStillReturnUserProfile()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            isActive: false // Inactive user
        );

        var expectedResponse = CreateResponseDTOUser(user);
        expectedResponse.IsActive = false;

        // Setup: Inactive user exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Mapper maps correctly
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(user))
            .Returns(expectedResponse);

        // Act
        var result = await _userServices.GetUserByIDAsync(ValidUserId);

        // Assert
        result.Should().NotBeNull("inactive users can still retrieve their profile");
        result.UserID.Should().Be(ValidUserId);
        result.IsActive.Should().BeFalse();

        // Note: Current implementation does not filter by IsActive
        // Consider adding business logic if inactive users should not retrieve profile

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
    }

    #endregion

    #region UTCID09: Mapper Returns Null

    [Fact]
    public async Task GetUserByIDAsync_WhenMapperReturnsNull_ShouldReturnNull()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Mapper returns null (misconfiguration scenario)
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(user))
            .Returns((ResponseDTOUser?)null);

        // Act
        var result = await _userServices.GetUserByIDAsync(ValidUserId);

        // Assert
        result.Should().BeNull("mapper returned null due to configuration issue");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _mapperMock.Verify(m => m.Map<ResponseDTOUser>(user), Times.Once);
    }

    #endregion

    #region UTCID10: User With Multiple Roles

    [Fact]
    public async Task GetUserByIDAsync_WithUserHavingMultipleRoles_ShouldReturnAllRoles()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);

        // Add multiple roles
        var customerRole = CreateTestRole("ROLE-CUSTOMER", "Customer", "Regular customer");
        var artisanRole = CreateTestRole("ROLE-ARTISAN", "Artisan", "Product creator");
        var adminRole = CreateTestRole("ROLE-ADMIN", "Admin", "Administrator");

        user.UserRoles = new List<UserRole>
        {
            new UserRole
            {
                Id = $"{ValidUserId}-ROLE-CUSTOMER",
                UserID = ValidUserId,
                RoleID = "ROLE-CUSTOMER",
                Role = customerRole
            },
            new UserRole
            {
                Id = $"{ValidUserId}-ROLE-ARTISAN",
                UserID = ValidUserId,
                RoleID = "ROLE-ARTISAN",
                Role = artisanRole
            },
            new UserRole
            {
                Id = $"{ValidUserId}-ROLE-ADMIN",
                UserID = ValidUserId,
                RoleID = "ROLE-ADMIN",
                Role = adminRole
            }
        };

        var expectedResponse = CreateResponseDTOUser(
            user,
            roles: new List<ResponseDTORole>
            {
                new ResponseDTORole { Name = "Customer", Description = "Regular customer" },
                new ResponseDTORole { Name = "Artisan", Description = "Product creator" },
                new ResponseDTORole { Name = "Admin", Description = "Administrator" }
            },
            addresses: new List<ResponseDTOAddress>()
        );

        // Setup: User exists with multiple roles
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Mapper maps correctly
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(user))
            .Returns(expectedResponse);

        // Act
        var result = await _userServices.GetUserByIDAsync(ValidUserId);

        // Assert
        result.Should().NotBeNull();
        result.Roles.Should().NotBeNull();
        result.Roles.Should().HaveCount(3);
        result.Roles!.Should().Contain(r => r.Name == "Customer");
        result.Roles.Should().Contain(r => r.Name == "Artisan");
        result.Roles.Should().Contain(r => r.Name == "Admin");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
    }

    #endregion

    #region UTCID11: User With Multiple Addresses

    [Fact]
    public async Task GetUserByIDAsync_WithUserHavingMultipleAddresses_ShouldReturnAllAddresses()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);

        // Add multiple addresses
        user.Addresses = new List<Address>
        {
            CreateTestAddress("ADDR-001", ValidUserId, "123 Main Street", "Hanoi", "Vietnam", isDefault: true),
            CreateTestAddress("ADDR-002", ValidUserId, "456 Second Ave", "Ho Chi Minh", "Vietnam", isDefault: false),
            CreateTestAddress("ADDR-003", ValidUserId, "789 Third Blvd", "Da Nang", "Vietnam", isDefault: false)
        };

        var expectedResponse = CreateResponseDTOUser(
            user,
            roles: new List<ResponseDTORole>(),
            addresses: new List<ResponseDTOAddress>
            {
                new ResponseDTOAddress { Line1 = "123 Main Street", City = "Hanoi", Country = "Vietnam", IsDefault = true },
                new ResponseDTOAddress { Line1 = "456 Second Ave", City = "Ho Chi Minh", Country = "Vietnam", IsDefault = false },
                new ResponseDTOAddress { Line1 = "789 Third Blvd", City = "Da Nang", Country = "Vietnam", IsDefault = false }
            }
        );

        // Setup: User exists with multiple addresses
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Mapper maps correctly
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(user))
            .Returns(expectedResponse);

        // Act
        var result = await _userServices.GetUserByIDAsync(ValidUserId);

        // Assert
        result.Should().NotBeNull();
        result.Addresses.Should().NotBeNull();
        result.Addresses.Should().HaveCount(3);
        result.Addresses!.Should().Contain(a => a.City == "Hanoi" && a.IsDefault == true);
        result.Addresses.Should().Contain(a => a.City == "Ho Chi Minh");
        result.Addresses.Should().Contain(a => a.City == "Da Nang");

        // Verify default address exists
        result.Addresses.Count(a => a.IsDefault).Should().Be(1);

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
    }

    #endregion

    #region UTCID12: Optional Fields Are Null

    [Fact]
    public async Task GetUserByIDAsync_WithNullOptionalFields_ShouldReturnUserWithNullValues()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            isActive: true,
            phoneNumber: null,      // Null optional field
            displayName: null,       // Null optional field
            dob: null,              // Null optional field
            userUrlImage: null      // Null optional field
        );

        var expectedResponse = CreateResponseDTOUser(user);
        expectedResponse.PhoneNumber = null;
        expectedResponse.DisplayName = null;
        expectedResponse.Dob = null;
        expectedResponse.UserUrlImage = null;

        // Setup: User exists with null optional fields
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Mapper maps correctly
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(user))
            .Returns(expectedResponse);

        // Act
        var result = await _userServices.GetUserByIDAsync(ValidUserId);

        // Assert
        result.Should().NotBeNull();
        result.UserID.Should().Be(ValidUserId);
        result.Username.Should().Be(ValidUsername);
        result.Email.Should().Be(ValidEmail);

        // Verify optional fields are null
        result.PhoneNumber.Should().BeNull();
        result.DisplayName.Should().BeNull();
        result.Dob.Should().BeNull();
        result.UserUrlImage.Should().BeNull();

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
    }

    #endregion

    #region UTCID13: User With Special Characters in Fields

    [Fact]
    public async Task GetUserByIDAsync_WithSpecialCharactersInFields_ShouldReturnCorrectly()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            "user@#$%^&*",                          // Special chars in username
            "test+special@example.com",              // Special chars in email
            isActive: true,
            phoneNumber: "+84-123-456-789",          // Phone with formatting
            displayName: "Nguyễn Văn Tâm (Admin)",  // Vietnamese chars + special chars
            dob: new DateTime(1990, 1, 1),
            userUrlImage: "https://example.com/image?id=123&size=large"
        );

        var expectedResponse = CreateResponseDTOUser(user);

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Mapper maps correctly
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(user))
            .Returns(expectedResponse);

        // Act
        var result = await _userServices.GetUserByIDAsync(ValidUserId);

        // Assert
        result.Should().NotBeNull();
        result.Username.Should().Be("user@#$%^&*");
        result.Email.Should().Be("test+special@example.com");
        result.PhoneNumber.Should().Be("+84-123-456-789");
        result.DisplayName.Should().Be("Nguyễn Văn Tâm (Admin)");
        result.UserUrlImage.Should().Contain("?id=123&size=large");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
    }

    #endregion

    #region UTCID14: Repository Query Performance Test

    [Fact]
    public async Task GetUserByIDAsync_ShouldCallRepositoryOnlyOnce()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);
        var expectedResponse = CreateResponseDTOUser(user);

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Mapper
        _mapperMock
            .Setup(m => m.Map<ResponseDTOUser>(user))
            .Returns(expectedResponse);

        // Act
        var result = await _userServices.GetUserByIDAsync(ValidUserId);

        // Assert
        result.Should().NotBeNull();

        // Verify: Repository called exactly once (no redundant queries)
        _userRepositoriesMock.Verify(
            r => r.GetUserByIDWithDetailAsync(ValidUserId),
            Times.Once,
            "repository should be called exactly once to avoid performance issues"
        );

        // Verify: Mapper called exactly once
        _mapperMock.Verify(
            m => m.Map<ResponseDTOUser>(user),
            Times.Once,
            "mapper should be called exactly once"
        );
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
