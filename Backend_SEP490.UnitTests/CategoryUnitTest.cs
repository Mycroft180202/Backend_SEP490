using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class CategoryUnitTest
    {
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<ICategoryRepositories> _categoryRepoMock;
        private readonly CategoryServicesImpl _service;

        public CategoryUnitTest()
        {
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _categoryRepoMock = new Mock<ICategoryRepositories>(); 
            _unitOfWorkMock.Setup(u => u.Categories).Returns(_categoryRepoMock.Object);
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1); 
            _service = new CategoryServicesImpl(_mapperMock.Object, _unitOfWorkMock.Object);
        }
        // CASE 1: GetAllCategories
        [Fact(DisplayName = "GetAllCategories - Normal Case - Return mapped data")]
        public async Task GetAllCategories_ReturnsMappedData()
        {
            // Arrange
            var fakeEntities = new List<Category>
            {
                new Category { Id = "CATE-001", Name = "Wood" },
                new Category { Id = "CATE-002", Name = "Stone" }
            };
            var fakeDtos = new List<ResponseDTOCategory>
            {
                new ResponseDTOCategory { Id = "CATE-001", Name = "Wood" },
                new ResponseDTOCategory { Id = "CATE-002", Name = "Stone" }
            };

            _categoryRepoMock.Setup(r => r.GetAllCategories())
                .ReturnsAsync(fakeEntities);
            _mapperMock.Setup(m => m.Map<IEnumerable<Category>, IEnumerable<ResponseDTOCategory>>(fakeEntities))
                .Returns(fakeDtos);

            // Act
            var result = await _service.GetAllCategories();

            // Assert
            Assert.Equal(2, result.Count());
            Assert.Equal("Wood", result.First().Name);
            _categoryRepoMock.Verify(r => r.GetAllCategories(), Times.Once);
        }
        [Fact(DisplayName = "GetAllCategories - Empty List - Returns empty result")]
        public async Task GetAllCategories_ReturnsEmpty_WhenNoData()
        {
            // Arrange
            var emptyEntities = new List<Category>();
            var emptyDtos = new List<ResponseDTOCategory>();

            _categoryRepoMock.Setup(r => r.GetAllCategories())
                .ReturnsAsync(emptyEntities);
            _mapperMock.Setup(m => m.Map<IEnumerable<Category>, IEnumerable<ResponseDTOCategory>>(emptyEntities))
                .Returns(emptyDtos);

            // Act
            var result = await _service.GetAllCategories();

            // Assert
            Assert.Empty(result);
            _categoryRepoMock.Verify(r => r.GetAllCategories(), Times.Once);
            _mapperMock.Verify(m => m.Map<IEnumerable<Category>, IEnumerable<ResponseDTOCategory>>(emptyEntities), Times.Once);
        }


        [Fact(DisplayName = "GetAllCategories - Null Repository Result - Returns empty list")]
        public async Task GetAllCategories_ReturnsEmpty_WhenRepositoryReturnsNull()
        {
            // Arrange
            _categoryRepoMock.Setup(r => r.GetAllCategories())
                .ReturnsAsync((List<Category>)null);

            // Act
            var result = await _service.GetAllCategories();

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
            _categoryRepoMock.Verify(r => r.GetAllCategories(), Times.Once);
        }


        [Fact(DisplayName = "AddCategory - Normal Case - Adds successfully")]
        public async Task AddCategory_ReturnsTrue_WhenAdded()
        {
            // Arrange
            var request = new RequestDTOCategory { Name = "Glass" };
            var mappedCategory = new Category { Name = "Glass" };

            _mapperMock.Setup(m => m.Map<Category>(request))
                .Returns(mappedCategory);

            _categoryRepoMock.Setup(r => r.AddCategory(It.IsAny<Category>()))
                .ReturnsAsync(true); 

            // Act
            var result = await _service.AddCategory(request);

            // Assert
            Assert.True(result);
            _categoryRepoMock.Verify(r => r.AddCategory(It.Is<Category>(c => c.Name == "Glass")), Times.Once);
        }
        [Fact(DisplayName = "AddCategory - Boundary Case - Input is null")]
        public async Task AddCategory_ThrowsException_WhenInputIsNull()
        {
            // Arrange
            RequestDTOCategory? request = null;
            _mapperMock.Setup(m => m.Map<Category>(request)).Returns((Category?)null);

            // Act & Assert
            await Assert.ThrowsAsync<NullReferenceException>(() => _service.AddCategory(request!));
        }
        [Fact(DisplayName = "AddCategory - Empty Name - Returns False")]
        public async Task AddCategory_ReturnsFalse_WhenNameIsEmpty()
        {
            // Arrange
            var request = new RequestDTOCategory { Name = "" };

            _mapperMock.Setup(m => m.Map<Category>(It.IsAny<RequestDTOCategory>()))
                .Returns(new Category { Name = "" });
            _categoryRepoMock.Setup(r => r.AddCategory(It.IsAny<Category>()))
                .ReturnsAsync(true);
            // Act
            var result = await _service.AddCategory(request);

            // Assert
            Assert.False(result);
            _categoryRepoMock.Verify(r => r.AddCategory(It.IsAny<Category>()), Times.Never);
        }

        // CASE 3: UpdateCategory - Normal
        [Fact(DisplayName = "UpdateCategory - Normal Case - Updates successfully")]
        public async Task UpdateCategory_ReturnsTrue_WhenUpdated()
        {
            // Arrange
            var existingCategory = new Category { Id = "CATE-001", Name = "OldName" };
            var updateRequest = new RequestDTOCategory { Name = "NewName" };

            _categoryRepoMock.Setup(r => r.GetCategoryById("CATE-001"))
                .ReturnsAsync(existingCategory);

            // Act
            var result = await _service.UpdateCategory("CATE-001", updateRequest);

            // Assert
            Assert.True(result);
            Assert.Equal("NewName", existingCategory.Name);
            _categoryRepoMock.Verify(r => r.UpdateCategory(It.Is<Category>(c => c.Name == "NewName")), Times.Once);
        }

        [Fact(DisplayName = "UpdateCategory - Category not found - Returns false")]
        public async Task UpdateCategory_ReturnsFalse_WhenCategoryNotFound()
        {
            // Arrange
            var updateRequest = new RequestDTOCategory { Name = "DoesNotMatter" };

            _categoryRepoMock.Setup(r => r.GetCategoryById("INVALID-ID"))
                .ReturnsAsync((Category)null);
            _mapperMock.Setup(m => m.Map(It.IsAny<RequestDTOCategory>(), It.IsAny<Category>()))
                .Returns(new Category());
            _categoryRepoMock.Setup(r => r.UpdateCategory(It.IsAny<Category>()))
                .ReturnsAsync(true);

            // Act
            var result = await _service.UpdateCategory("INVALID-ID", updateRequest);

            // Assert
            Assert.False(result);
            _categoryRepoMock.Verify(r => r.UpdateCategory(It.IsAny<Category>()), Times.Never);
        }

        [Fact(DisplayName = "UpdateCategory - Empty Name - Returns false")]
        public async Task UpdateCategory_ReturnsFalse_WhenNameIsEmpty()
        {
            // Arrange
            var existingCategory = new Category { Id = "CATE-001", Name = "OldName" };
            var updateRequest = new RequestDTOCategory { Name = "" };

            _categoryRepoMock.Setup(r => r.GetCategoryById("CATE-001"))
                .ReturnsAsync(existingCategory);

            // Act
            var result = await _service.UpdateCategory("CATE-001", updateRequest);

            // Assert
            Assert.False(result);
            _categoryRepoMock.Verify(r => r.UpdateCategory(It.IsAny<Category>()), Times.Never);
        }

        [Fact(DisplayName = "UpdateCategory - Null Name - Returns false")]
        public async Task UpdateCategory_ReturnsFalse_WhenNameIsNull()
        {
            // Arrange
            var existingCategory = new Category { Id = "CATE-001", Name = "OldName" };
            var updateRequest = new RequestDTOCategory { Name = null };

            _categoryRepoMock.Setup(r => r.GetCategoryById("CATE-001"))
                .ReturnsAsync(existingCategory);

            // Act
            var result = await _service.UpdateCategory("CATE-001", updateRequest);

            // Assert
            Assert.False(result);
            _categoryRepoMock.Verify(r => r.UpdateCategory(It.IsAny<Category>()), Times.Never);
        }
    }
}
