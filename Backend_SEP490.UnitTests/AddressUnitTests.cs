using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Moq;
using System.ComponentModel.DataAnnotations;
namespace Backend_SEP490.UnitTests
{

    public class AddressUnitTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IAddressRepositories> _addressRepoMock;
        private readonly AddressServiceImpl _service;

        public AddressUnitTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _addressRepoMock = new Mock<IAddressRepositories>();
            _unitOfWorkMock.Setup(u => u.Address).Returns(_addressRepoMock.Object);

            _service = new AddressServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object);
        }

        //  CASE 1: Bình thường
        [Fact(DisplayName = "CreateUserAddressAsync - Normal Case - Return Created")]
        public async Task CreateUserAddressAsync_ShouldReturnStatus_WhenValidInput()
        {
            var userId = "U001";
            var request = new RequestCreateAndUpdateAddress
            {
                Line1 = "123 Street",
                Line2 = "Apt 1",
                City = "Da Nang",
                PosttalCode = "550000",
                Country = "Vietnam",
                IsDefault = true
            };

            _addressRepoMock.Setup(r => r.CreateAddressAsync(It.IsAny<Address>())).ReturnsAsync("Create Address successfully!");

            var result = await _service.CreateUserAddressAsync(userId, request);

            Assert.Equal("Create Address successfully!", result);
            _addressRepoMock.Verify(r => r.CreateAddressAsync(It.IsAny<Address>()), Times.Once);
        }

        //  CASE 2: Xảy ra Exception
        [Fact(DisplayName = "CreateUserAddressAsync - Exception Thrown - Return Create Address failed!")]
        public async Task CreateUserAddressAsync_ShouldThrowException_WhenRepositoryFails()
        {
            var userId = "U001";
            var request = new RequestCreateAndUpdateAddress
            {
                Line1 = "123 Street",
                Line2 = "Apt 1",
                City = "Da Nang",
                PosttalCode = "550000",
                Country = "Vietnam",
                IsDefault = true
            };

            _addressRepoMock
                .Setup(r => r.CreateAddressAsync(It.IsAny<Address>()))
                .ThrowsAsync(new Exception("Database connection error"));

            var exception = await Assert.ThrowsAsync<Exception>(() => _service.CreateUserAddressAsync(userId, request));

            Assert.Equal("Create Address failed!", exception.Message);
            _addressRepoMock.Verify(r => r.CreateAddressAsync(It.IsAny<Address>()), Times.Once);
        }

        //  CASE 3: Kiểm tra định dạng ID
        [Fact(DisplayName = "CreateUserAddressAsync - Generate AddressId correctly")]
        public async Task CreateUserAddressAsync_ShouldGenerateAddressIdWithUserIdAndDate()
        {
            var userId = "U777";
            var request = new RequestCreateAndUpdateAddress { City = "HaNoi", Line1 = "Abc", Country = "VN" };
            Address captured = null;

            _addressRepoMock.Setup(r => r.CreateAddressAsync(It.IsAny<Address>()))
                .Callback<Address>(a => captured = a)
                .ReturnsAsync("Created");

            var result = await _service.CreateUserAddressAsync(userId, request);

            Assert.Equal("Created", result);
            Assert.NotNull(captured);
            Assert.StartsWith($"ADR-{userId}-", captured.Id);
            Assert.Equal("HaNoi", captured.City);
        }

        //  CASE 4: Line1 trống
        [Fact(DisplayName = "CreateUserAddressAsync - Line1 empty - Should fail validation")]
        public void CreateUserAddressAsync_Line1Empty_ShouldFailValidation()
        {
            var model = new RequestCreateAndUpdateAddress
            {
                Line1 = "",
                City = "Hanoi",
                Country = "Vietnam"
            };

            var results = ValidateModel(model);
            Assert.Contains(results, v => v.ErrorMessage.Contains("Địa chỉ dòng 1 không được để trống"));
        }

        //  CASE 5: City trống
        [Fact(DisplayName = "CreateUserAddressAsync - City empty - Should fail validation")]
        public void CreateUserAddressAsync_CityEmpty_ShouldFailValidation()
        {
            var model = new RequestCreateAndUpdateAddress
            {
                Line1 = "123",
                City = "",
                Country = "Vietnam"
            };

            var results = ValidateModel(model);
            Assert.Contains(results, v => v.ErrorMessage.Contains("Thành phố không được để trống"));
        }

        //  CASE 6: Country trống
        [Fact(DisplayName = "CreateUserAddressAsync - Country empty - Should fail validation")]
        public void CreateUserAddressAsync_CountryEmpty_ShouldFailValidation()
        {
            var model = new RequestCreateAndUpdateAddress
            {
                Line1 = "123",
                City = "Da Nang",
                Country = ""
            };

            var results = ValidateModel(model);
            Assert.Contains(results, v => v.ErrorMessage.Contains("Quốc gia không được để trống"));
        }

        //  CASE 7: PosttalCode sai định dạng
        [Fact(DisplayName = "CreateUserAddressAsync - Invalid postal code - Should fail validation")]
        public void CreateUserAddressAsync_InvalidPosttalCode_ShouldFailValidation()
        {
            var model = new RequestCreateAndUpdateAddress
            {
                Line1 = "123",
                City = "Da Nang",
                Country = "VN",
                PosttalCode = "ABC123"
            };

            var results = ValidateModel(model);
            Assert.Contains(results, v => v.ErrorMessage.Contains("Mã bưu điện phải là số"));
        }

        //  CASE 8: Line1 quá dài
        [Fact(DisplayName = "CreateUserAddressAsync - Line1 too long - Should fail validation")]
        public void CreateUserAddressAsync_Line1TooLong_ShouldFailValidation()
        {
            var model = new RequestCreateAndUpdateAddress
            {
                Line1 = new string('A', 101),
                City = "Da Nang",
                Country = "Vietnam"
            };

            var results = ValidateModel(model);
            Assert.Contains(results, v => v.ErrorMessage.Contains("Địa chỉ dòng 1 không được vượt quá 100 ký tự"));
        }

        //  CASE 9: Line2 quá dài
        [Fact(DisplayName = "CreateUserAddressAsync - Line1 too long - Should fail validation")]
        public void CreateUserAddressAsync_Line2TooLong_ShouldFailValidation()
        {
            var model = new RequestCreateAndUpdateAddress
            {
                Line2 = new string('A', 101),
                City = "Da Nang",
                Country = "Vietnam"
            };

            var results = ValidateModel(model);
            Assert.Contains(results, v => v.ErrorMessage.Contains("Địa chỉ dòng 2 không được vượt quá 100 ký tự"));
        }
        //  CASE 10: PostalCode quá dài
        [Fact(DisplayName = "CreateUserAddressAsync - PosttalCode too long - Should fail validation")]
        public void CreateUserAddressAsync_PosttalCodeTooLong_ShouldFailValidation()
        {
            var model = new RequestCreateAndUpdateAddress
            {
                PosttalCode = new string('A', 11),
                City = "Da Nang",
                Country = "Vietnam"
            };

            var results = ValidateModel(model);
            Assert.Contains(results, v => v.ErrorMessage.Contains("Mã bưu điện phải là số và có từ 4–10 ký tự"));
        }

        //  CASE 11: City quá dài
        [Fact(DisplayName = "CreateUserAddressAsync - City too long - Should fail validation")]
        public void CreateUserAddressAsync_CityTooLong_ShouldFailValidation()
        {
            var model = new RequestCreateAndUpdateAddress
            {
                Line1 = "123",
                City = new string('B', 60),
                Country = "Vietnam"
            };

            var results = ValidateModel(model);
            Assert.Contains(results, v => v.ErrorMessage.Contains("Tên thành phố không được vượt quá 50 ký tự"));
        }

        //  CASE 12: Country quá dài
        [Fact(DisplayName = "CreateUserAddressAsync - Country too long - Should fail validation")]
        public void CreateUserAddressAsync_CountryTooLong_ShouldFailValidation()
        {
            var model = new RequestCreateAndUpdateAddress
            {
                Line1 = "123",
                City = "Da Nang",
                Country = new string('C', 60)
            };

            var results = ValidateModel(model);
            Assert.Contains(results, v => v.ErrorMessage.Contains("Tên quốc gia không được vượt quá 50 ký tự"));
        }
        [Fact(DisplayName = "DeleteUserAddressAsync - Address not found - Return message")]
        public async Task DeleteUserAddressAsync_AddressNotFound_ReturnsMessage()
        {
            // Arrange
            var addressId = "ADDR-001";
            _addressRepoMock
                .Setup(r => r.GetAddressByIdAsync(addressId))
                .ReturnsAsync((Address)null!);

            // Act
            var result = await _service.DeleteUserAddressAsync(addressId);

            // Assert
            Assert.Equal("Address not found!", result);
            _addressRepoMock.Verify(r => r.DeleteAddressAsync(It.IsAny<Address>()), Times.Never);
        }
        [Fact(DisplayName = "DeleteUserAddressAsync - Valid address - Delete success")]
        public async Task DeleteUserAddressAsync_ValidAddress_ReturnsSuccessMessage()
        {
            // Arrange
            var addressId = "ADDR-002";
            var address = new Address { Id = addressId };

            _addressRepoMock
                .Setup(r => r.GetAddressByIdAsync(addressId))
                .ReturnsAsync(address);

            _addressRepoMock
                .Setup(r => r.DeleteAddressAsync(address))
                .ReturnsAsync("Deleted successfully!");

            // Act
            var result = await _service.DeleteUserAddressAsync(addressId);

            // Assert
            Assert.Equal("Deleted successfully!", result);
            _addressRepoMock.Verify(r => r.DeleteAddressAsync(address), Times.Once);
        }
        [Fact(DisplayName = "DeleteUserAddressAsync - Delete failed - Return failed message")]
        public async Task DeleteUserAddressAsync_DeleteFailed_ReturnsFailedMessage()
        {
            // Arrange
            var addressId = "ADDR-003";
            var address = new Address { Id = addressId };

            _addressRepoMock
                .Setup(r => r.GetAddressByIdAsync(addressId))
                .ReturnsAsync(address);

            _addressRepoMock
                .Setup(r => r.DeleteAddressAsync(address))
                .ReturnsAsync("Delete failed!");

            // Act
            var result = await _service.DeleteUserAddressAsync(addressId);

            // Assert
            Assert.Equal("Delete failed!", result);
            _addressRepoMock.Verify(r => r.DeleteAddressAsync(address), Times.Once);
        }
        [Fact(DisplayName = "UpdateUserAddressAsync - Address not found - Return not found message")]
        public async Task UpdateUserAddressAsync_AddressNotFound_ReturnsMessage()
        {
            // Arrange
            var addressId = "ADDR-001";
            var request = new RequestCreateAndUpdateAddress
            {
                Line1 = "123 Main St",
                City = "Hanoi",
                Country = "Vietnam"
            };

            _addressRepoMock
                .Setup(r => r.GetAddressByIdAsync(addressId))
                .ReturnsAsync((Address)null!);

            // Act
            var result = await _service.UpdateUserAddressAsync(addressId, request);

            // Assert
            Assert.Equal("Address not found!", result);
            _addressRepoMock.Verify(r => r.UpdateAddressAsync(It.IsAny<Address>(), It.IsAny<RequestCreateAndUpdateAddress>()), Times.Never);
        }
        [Fact(DisplayName = "UpdateUserAddressAsync - Valid address - Update success")]
        public async Task UpdateUserAddressAsync_ValidAddress_ReturnsSuccessMessage()
        {
            // Arrange
            var addressId = "ADDR-002";
            var request = new RequestCreateAndUpdateAddress
            {
                Line1 = "456 Street A",
                City = "Danang",
                Country = "Vietnam"
            };

            var existingAddress = new Address { Id = addressId };

            _addressRepoMock
                .Setup(r => r.GetAddressByIdAsync(addressId))
                .ReturnsAsync(existingAddress);

            _addressRepoMock
                .Setup(r => r.UpdateAddressAsync(existingAddress, request))
                .ReturnsAsync("Update successful!");

            // Act
            var result = await _service.UpdateUserAddressAsync(addressId, request);

            // Assert
            Assert.Equal("Update successful!", result);
            _addressRepoMock.Verify(r => r.UpdateAddressAsync(existingAddress, request), Times.Once);
        }


        [Fact(DisplayName = "UpdateUserAddressAsync - Update failed - Return failed message")]
        public async Task UpdateUserAddressAsync_UpdateFailed_ReturnsFailedMessage()
        {
            // Arrange
            var addressId = "ADDR-003";
            var request = new RequestCreateAndUpdateAddress
            {
                Line1 = "789 Street B",
                City = "Hanoi",
                Country = "Vietnam"
            };

            var existingAddress = new Address { Id = addressId };

            _addressRepoMock
                .Setup(r => r.GetAddressByIdAsync(addressId))
                .ReturnsAsync(existingAddress);

            _addressRepoMock
                .Setup(r => r.UpdateAddressAsync(existingAddress, request))
                .ReturnsAsync("Update failed!");

            // Act
            var result = await _service.UpdateUserAddressAsync(addressId, request);

            // Assert
            Assert.Equal("Update failed!", result);
            _addressRepoMock.Verify(r => r.UpdateAddressAsync(existingAddress, request), Times.Once);
        }

        // CASE 1: Normal - repo returns addresses and mapper maps them
        [Fact(DisplayName = "GetAllAddressByUserIdAsync - Normal Case - Returns mapped addresses")]
        public async Task GetAllAddressByUserIdAsync_ReturnsMappedAddresses_WhenDataExists()
        {
            // Arrange
            var userId = "U001";
            var addresses = new List<Address>
            {
                new Address { Id = "ADR-1", Line1 = "L1", Line2 = "L2", City = "Hanoi", PosttalCode = "10000", Country = "VN", IsDefault = true },
                new Address { Id = "ADR-2", Line1 = "L3", Line2 = "L4", City = "HCMC", PosttalCode = "70000", Country = "VN", IsDefault = false }
            };

            var dtos = new List<ResponseDTOAddress>
            {
                new ResponseDTOAddress { Line1 = "L1", Line2 = "L2", City = "Hanoi", PosttalCode = "10000", Country = "VN", IsDefault = true },
                new ResponseDTOAddress { Line1 = "L3", Line2 = "L4", City = "HCMC", PosttalCode = "70000", Country = "VN", IsDefault = false }
            };

            _addressRepoMock.Setup(r => r.GetAllAddressByUserIdAsync(userId))
                .ReturnsAsync(addresses);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOAddress>>(addresses))
                .Returns(dtos);

            // Act
            var result = await _service.GetAllAddressByUserIdAsync(userId);

            // Assert
            Assert.NotNull(result);
            var list = result.ToList();
            Assert.Equal(2, list.Count);
            Assert.Equal("Hanoi", list[0].City);
            _addressRepoMock.Verify(r => r.GetAllAddressByUserIdAsync(userId), Times.Once);
            _mapperMock.Verify(m => m.Map<IEnumerable<ResponseDTOAddress>>(addresses), Times.Once);
        }

        // CASE 2: Empty list returned by repo
        [Fact(DisplayName = "GetAllAddressByUserIdAsync - Empty List - Returns empty")]
        public async Task GetAllAddressByUserIdAsync_ReturnsEmpty_WhenRepoReturnsEmptyList()
        {
            // Arrange
            var userId = "U002";
            var emptyAddresses = new List<Address>();
            var emptyDtos = new List<ResponseDTOAddress>();

            _addressRepoMock.Setup(r => r.GetAllAddressByUserIdAsync(userId))
                .ReturnsAsync(emptyAddresses);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOAddress>>(emptyAddresses))
                .Returns(emptyDtos);

            // Act
            var result = await _service.GetAllAddressByUserIdAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
            _addressRepoMock.Verify(r => r.GetAllAddressByUserIdAsync(userId), Times.Once);
            _mapperMock.Verify(m => m.Map<IEnumerable<ResponseDTOAddress>>(emptyAddresses), Times.Once);
        }

        // CASE 3: Repo returns null -> service should return empty collection (defensive)
        [Fact(DisplayName = "GetAllAddressByUserIdAsync - Repo returns null - Returns empty collection")]
        public async Task GetAllAddressByUserIdAsync_ReturnsEmpty_WhenRepoReturnsNull()
        {
            // Arrange
            var userId = "U003";
            _addressRepoMock.Setup(r => r.GetAllAddressByUserIdAsync(userId))
                .ReturnsAsync((IEnumerable<Address>)null);


            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOAddress>>(It.IsAny<IEnumerable<Address>>()))
                .Returns(new List<ResponseDTOAddress>());

            // Act
            var result = await _service.GetAllAddressByUserIdAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
            _addressRepoMock.Verify(r => r.GetAllAddressByUserIdAsync(userId), Times.Once);
        }


        private static List<ValidationResult> ValidateModel(object model)
        {
            var context = new ValidationContext(model, null, null);
            var results = new List<ValidationResult>();
            Validator.TryValidateObject(model, context, results, true);
            return results;
        }
    }
}