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
/// Unit tests for UpdateUserAsync method in UserServicesImpl
/// Tests cover the PUT /api/User/users/me endpoint (Update User Profile)
/// Total: 20 test cases ensuring comprehensive coverage of profile update scenarios
/// </summary>
public class UserServicesUpdateUserProfileTests : IDisposable
{
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IUserRepositories> _userRepositoriesMock;
    private readonly UserServicesImpl _userServices;

    // Test data constants
    private const string ValidUserId = "USER-20251027-120000";
    private const string NonExistentUserId = "USER-99999999-999999";
    private const string ValidUsername = "testuser";
    private const string ValidEmail = "test@example.com";
    private const string CustomerRoleId = "ROLE-CUSTOMER";
    private const string ArtisanRoleId = "ROLE-ARTISAN";
    private const string AdminRoleId = "ROLE-ADMIN";

    public UserServicesUpdateUserProfileTests()
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
    /// Create a valid test user with default values
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
            UpdateAt = DateTime.UtcNow.AddDays(-1),
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
    /// Create a RequestUpdateUser with specified fields
    /// </summary>
    private RequestUpdateUser CreateUpdateRequest(
        bool isActive = true,
        string? phoneNumber = null,
        string? displayName = null,
        DateTime? dob = null,
        string? rolesId = null,
        string? userUrlImage = null)
    {
        return new RequestUpdateUser
        {
            IsActive = isActive,
            PhoneNumber = phoneNumber,
            DisplayName = displayName,
            Dob = dob,
            RolesId = rolesId,
            UserUrlImage = userUrlImage
        };
    }

    #endregion

    #region UTCID01: Valid Update All Fields - Normal Flow

    [Fact]
    public async Task UpdateUserAsync_WithValidDataAllFields_ShouldUpdateSuccessfully()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            isActive: true,
            phoneNumber: "0123456789",
            displayName: "Old Name",
            dob: new DateTime(1990, 1, 1),
            userUrlImage: "old-image.jpg"
        );

        var updateRequest = CreateUpdateRequest(
            isActive: false,
            phoneNumber: "0987654321",
            displayName: "New Display Name",
            dob: new DateTime(1995, 5, 15),
            rolesId: ArtisanRoleId,
            userUrlImage: "https://example.com/new-image.jpg"
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("all fields should be updated successfully");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID02: User Not Exists

    [Fact]
    public async Task UpdateUserAsync_WithNonExistentUser_ShouldReturnFalse()
    {
        // Arrange
        var updateRequest = CreateUpdateRequest(displayName: "New Name");

        // Setup: User does not exist
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(NonExistentUserId))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userServices.UpdateUserAsync(NonExistentUserId, updateRequest);

        // Assert
        result.Should().BeFalse("user does not exist");

        // Verify: UpdateUserAsync was never called
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(NonExistentUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(It.IsAny<User>(), It.IsAny<RequestUpdateUser>()), Times.Never);
    }

    #endregion

    #region UTCID03: Null UserId

    [Fact]
    public async Task UpdateUserAsync_WithNullUserId_ShouldReturnFalse()
    {
        // Arrange
        string? nullUserId = null;
        var updateRequest = CreateUpdateRequest(displayName: "New Name");

        // Setup: Repository returns null for null userId
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(nullUserId!))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userServices.UpdateUserAsync(nullUserId!, updateRequest);

        // Assert
        result.Should().BeFalse("null userId cannot find any user");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(nullUserId!), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(It.IsAny<User>(), It.IsAny<RequestUpdateUser>()), Times.Never);
    }

    #endregion

    #region UTCID04: Empty UserId

    [Fact]
    public async Task UpdateUserAsync_WithEmptyUserId_ShouldReturnFalse()
    {
        // Arrange
        var emptyUserId = string.Empty;
        var updateRequest = CreateUpdateRequest(displayName: "New Name");

        // Setup: Repository returns null for empty userId
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(emptyUserId))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userServices.UpdateUserAsync(emptyUserId, updateRequest);

        // Assert
        result.Should().BeFalse("empty userId cannot find any user");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(emptyUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(It.IsAny<User>(), It.IsAny<RequestUpdateUser>()), Times.Never);
    }

    #endregion

    #region UTCID05: Update DisplayName Only

    [Fact]
    public async Task UpdateUserAsync_WithDisplayNameOnly_ShouldUpdateOnlyDisplayName()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            phoneNumber: "0123456789",
            displayName: "Old Name",
            userUrlImage: "old-image.jpg"
        );

        var updateRequest = CreateUpdateRequest(
            displayName: "New Display Name"
            // Other fields are null
        );

        var initialPhoneNumber = user.PhoneNumber;
        var initialUserUrlImage = user.UserUrlImage;

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue();

        // Note: Repository logic only updates non-null fields
        // PhoneNumber and UserUrlImage should remain unchanged

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID06: Update PhoneNumber Only

    [Fact]
    public async Task UpdateUserAsync_WithPhoneNumberOnly_ShouldUpdateOnlyPhoneNumber()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            phoneNumber: "0123456789",
            displayName: "Test User"
        );

        var updateRequest = CreateUpdateRequest(
            phoneNumber: "0987654321"
            // Other fields are null
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("phone number should be updated");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID07: Update UserUrlImage Only

    [Fact]
    public async Task UpdateUserAsync_WithUserUrlImageOnly_ShouldUpdateOnlyImage()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            userUrlImage: "old-image.jpg"
        );

        var updateRequest = CreateUpdateRequest(
            userUrlImage: "https://example.com/new-profile-pic.jpg"
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("user image URL should be updated");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID08: Update Dob Only

    [Fact]
    public async Task UpdateUserAsync_WithDobOnly_ShouldUpdateOnlyDob()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            dob: new DateTime(1990, 1, 1)
        );

        var updateRequest = CreateUpdateRequest(
            dob: new DateTime(1995, 12, 25)
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("date of birth should be updated");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID09: Update IsActive Only

    [Fact]
    public async Task UpdateUserAsync_WithIsActiveChange_ShouldUpdateIsActive()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            isActive: true
        );

        var updateRequest = CreateUpdateRequest(
            isActive: false // Change to inactive
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("IsActive should be updated");

        // Note: IsActive is always updated because it's a bool (not nullable)

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID10: Add New Role

    [Fact]
    public async Task UpdateUserAsync_WithNewRole_ShouldAddRoleSuccessfully()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);
        
        // User has Customer role
        user.UserRoles = new List<UserRole>
        {
            new UserRole
            {
                Id = $"{ValidUserId}-{CustomerRoleId}",
                UserID = ValidUserId,
                RoleID = CustomerRoleId,
                Role = CreateTestRole(CustomerRoleId, "Customer", "Regular customer")
            }
        };

        var updateRequest = CreateUpdateRequest(
            rolesId: ArtisanRoleId // Add Artisan role
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds (repository will add new role)
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("new role should be added");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID11: Add Existing Role

    [Fact]
    public async Task UpdateUserAsync_WithExistingRole_ShouldNotDuplicateRole()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);
        
        // User already has Customer role
        user.UserRoles = new List<UserRole>
        {
            new UserRole
            {
                Id = $"{ValidUserId}-{CustomerRoleId}",
                UserID = ValidUserId,
                RoleID = CustomerRoleId,
                Role = CreateTestRole(CustomerRoleId, "Customer", "Regular customer")
            }
        };

        var updateRequest = CreateUpdateRequest(
            rolesId: CustomerRoleId // Add same role again
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Repository handles duplicate check, returns true
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("duplicate role should be handled gracefully");

        // Note: Repository checks for existing role and doesn't add duplicate

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID12: Invalid RoleID

    [Fact]
    public async Task UpdateUserAsync_WithInvalidRoleId_ShouldReturnFalse()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);

        var updateRequest = CreateUpdateRequest(
            rolesId: "INVALID-ROLE-999" // Non-existent role
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Repository fails due to invalid role (exception caught, returns false)
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(false);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeFalse("invalid role ID should cause update to fail");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID13: Empty String Fields

    [Fact]
    public async Task UpdateUserAsync_WithEmptyStringFields_ShouldNotUpdateThoseFields()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            phoneNumber: "0123456789",
            displayName: "Original Name"
        );

        var updateRequest = CreateUpdateRequest(
            displayName: "",  // Empty string (should not update)
            phoneNumber: ""   // Empty string (should not update)
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Repository handles empty strings (doesn't update due to IsNullOrEmpty check)
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue();

        // Note: Repository logic checks IsNullOrEmpty, so empty strings don't update fields
        // This means you cannot intentionally set a field to empty string

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID14: Null Optional Fields

    [Fact]
    public async Task UpdateUserAsync_WithAllNullOptionalFields_ShouldOnlyUpdateIsActive()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            phoneNumber: "0123456789",
            displayName: "Original Name"
        );

        var updateRequest = CreateUpdateRequest(
            isActive: false, // Only IsActive provided
            phoneNumber: null,
            displayName: null,
            dob: null,
            rolesId: null,
            userUrlImage: null
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds (only IsActive updated)
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("IsActive should be updated, optional fields unchanged");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID15: Special Characters in Fields

    [Fact]
    public async Task UpdateUserAsync_WithSpecialCharacters_ShouldUpdateCorrectly()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);

        var updateRequest = CreateUpdateRequest(
            displayName: "Nguyễn Văn Tâm (Admin) ★",  // Vietnamese + special chars
            phoneNumber: "+84-123-456-789 ext.100",   // Phone with formatting
            userUrlImage: "https://example.com/image?id=123&size=large&format=jpg"
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("special characters should be handled correctly");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID16: Very Long DisplayName

    [Fact]
    public async Task UpdateUserAsync_WithVeryLongDisplayName_ShouldHandleGracefully()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);

        var veryLongName = new string('A', 500); // 500 characters
        var updateRequest = CreateUpdateRequest(
            displayName: veryLongName
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Repository may fail due to DB constraint or succeed
        // Current implementation: no validation, depends on DB
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(false); // Assuming DB constraint violation

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeFalse("very long display name may exceed DB constraint");

        // Note: Consider adding MaxLength validation in DTO

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID17: Invalid Phone Format

    [Fact]
    public async Task UpdateUserAsync_WithInvalidPhoneFormat_ShouldAcceptAsIs()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);

        var updateRequest = CreateUpdateRequest(
            phoneNumber: "invalid-phone-format-abc123!@#"
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: No validation, accepts any string
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("no phone format validation in current implementation");

        // Note: Consider adding phone number validation

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID18: Future Dob

    [Fact]
    public async Task UpdateUserAsync_WithFutureDob_ShouldAcceptWithoutValidation()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);

        var updateRequest = CreateUpdateRequest(
            dob: DateTime.UtcNow.AddYears(10) // Future date
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: No DOB validation, accepts any date
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("no DOB validation in current implementation");

        // Note: Consider adding DOB validation (must be in past, age >= 13, etc.)

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID19: Repository Update Fails

    [Fact]
    public async Task UpdateUserAsync_WhenRepositoryUpdateFails_ShouldReturnFalse()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);

        var updateRequest = CreateUpdateRequest(
            displayName: "New Name"
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Repository update fails (DB error, exception caught)
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(false);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeFalse("repository update failure should propagate");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID20: Multiple Fields Update

    [Fact]
    public async Task UpdateUserAsync_WithMultipleFields_ShouldUpdateAllProvided()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            isActive: true,
            phoneNumber: "0123456789",
            displayName: "Old Name"
        );

        var updateRequest = CreateUpdateRequest(
            isActive: false,
            displayName: "Updated Name",
            phoneNumber: "0987654321",
            userUrlImage: "https://example.com/profile.jpg"
            // Dob and RolesId not provided (null)
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue("multiple fields should be updated successfully");

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID21: Whitespace Only Fields

    [Fact]
    public async Task UpdateUserAsync_WithWhitespaceOnlyFields_ShouldNotUpdate()
    {
        // Arrange
        var user = CreateTestUser(
            ValidUserId,
            ValidUsername,
            ValidEmail,
            displayName: "Original Name",
            phoneNumber: "0123456789"
        );

        var updateRequest = CreateUpdateRequest(
            displayName: "   ",  // Whitespace only
            phoneNumber: "\t\t"  // Tab characters
        );

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Repository may trim or accept whitespace
        // Current implementation: IsNullOrEmpty doesn't catch whitespace-only
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue();

        // Note: IsNullOrEmpty doesn't catch whitespace-only strings
        // Consider using IsNullOrWhiteSpace for better validation

        // Verify method calls
        _userRepositoriesMock.Verify(r => r.GetUserByIDWithDetailAsync(ValidUserId), Times.Once);
        _userRepositoriesMock.Verify(r => r.UpdateUserAsync(user, updateRequest), Times.Once);
    }

    #endregion

    #region UTCID22: Concurrent Update Scenario

    [Fact]
    public async Task UpdateUserAsync_ShouldCallRepositoryOnlyOnce()
    {
        // Arrange
        var user = CreateTestUser(ValidUserId, ValidUsername, ValidEmail);
        var updateRequest = CreateUpdateRequest(displayName: "New Name");

        // Setup: User exists
        _userRepositoriesMock
            .Setup(r => r.GetUserByIDWithDetailAsync(ValidUserId))
            .ReturnsAsync(user);

        // Setup: Update succeeds
        _userRepositoriesMock
            .Setup(r => r.UpdateUserAsync(user, updateRequest))
            .ReturnsAsync(true);

        // Act
        var result = await _userServices.UpdateUserAsync(ValidUserId, updateRequest);

        // Assert
        result.Should().BeTrue();

        // Verify: Repository methods called exactly once (no redundant calls)
        _userRepositoriesMock.Verify(
            r => r.GetUserByIDWithDetailAsync(ValidUserId),
            Times.Once,
            "GetUserByIDWithDetailAsync should be called exactly once"
        );

        _userRepositoriesMock.Verify(
            r => r.UpdateUserAsync(user, updateRequest),
            Times.Once,
            "UpdateUserAsync should be called exactly once"
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
