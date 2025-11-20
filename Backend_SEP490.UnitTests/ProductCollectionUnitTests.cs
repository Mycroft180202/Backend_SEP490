using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace Backend_SEP490.UnitTests
{
    public class ProductCollectionUnitTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<Cloudinary> _cloudinaryMock;
        private readonly ProductCollectionServicesImpl _service;

        public ProductCollectionUnitTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _cloudinaryMock = new Mock<Cloudinary>(new Account("dummy", "dummy", "dummy"));
            _service = new ProductCollectionServicesImpl(_mapperMock.Object, _unitOfWorkMock.Object, _cloudinaryMock.Object);
        }

        [Fact(DisplayName = "GetAllProducts - Returns mapped products")]
        public async Task GetAllProducts_ReturnsMappedProducts()
        {
            var collections = new List<ProductCollection>
            {
                new ProductCollection { ProductCollectionId = 1, Title = "Collection 1", Image = "url1" },
                new ProductCollection { ProductCollectionId = 2, Title = "Collection 2", Image = "url2" }
            };

            var mapped = collections.Select(c => new ResponseDTOProductCollection
            {
                ProductCollectionId = c.ProductCollectionId,
                Title = c.Title,
                Image = c.Image
            }).ToList();

            _unitOfWorkMock.Setup(u => u.ProductCollections.GetAllProductsCollection())
                .ReturnsAsync(collections);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOProductCollection>>(collections))
                .Returns(mapped);

            var result = await _service.GetAllProducts();

            Assert.Equal(2, result.Count());
            Assert.Contains(result, r => r.ProductCollectionId == 1 && r.Title == "Collection 1");
        }
        [Fact(DisplayName = "GetProductCollectionById - Returns mapped collection with products")]
        public async Task GetProductCollectionById_ReturnsMappedCollection()
        {
            int collectionId = 1;
            var collectionEntity = new ProductCollection { ProductCollectionId = collectionId, Title = "Collection 1" };

            // Mock list Product
            var products = new List<Product>
            {
                new Product
                {
                    Id = "P1",
                    Name = "Product1",
                    ShortDescription = "Short1",
                    LongDescription = "Long1",
                    Price = 10,
                    Category = "Cat1",
                    ArtisanId = "A1",
                    IsActive = true,
                    Stock = 5,
                    CreateAt = DateTime.UtcNow.AddDays(-1),
                    UpdateAt = DateTime.UtcNow,
                    ProductImages = new List<ProductImage> { new ProductImage { Id = "IMG1", URL = "url1" } }
                },
                new Product
                {
                    Id = "P2",
                    Name = "Product2",
                    ShortDescription = "Short2",
                    LongDescription = "Long2",
                    Price = 20,
                    Category = "Cat2",
                    ArtisanId = "A2",
                    IsActive = true,
                    Stock = 10,
                    CreateAt = DateTime.UtcNow.AddDays(-2),
                    UpdateAt = DateTime.UtcNow,
                    ProductImages = new List<ProductImage> { new ProductImage { Id = "IMG2", URL = "url2" } }
                }
            };

            // Mock mapping result
            var mappedCollection = new ResponseDTOProductCollectionDetail { ProductCollectionId = collectionId, Title = "Collection 1" };
            var mappedProducts = products.Select(p => new ResponseDTOProduct
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                Category = p.Category,
                ShortDescription = p.ShortDescription,
                DisplayName = p.ArtisanId 
            }).ToList();

            _unitOfWorkMock.Setup(u => u.ProductCollections.GetProductCollectionById(collectionId))
                .ReturnsAsync(collectionEntity);

            _unitOfWorkMock.Setup(u => u.ProductCollections.GetAllProductsInCollection(collectionId))
                .ReturnsAsync(products);

            _mapperMock.Setup(m => m.Map<ResponseDTOProductCollectionDetail>(collectionEntity))
                .Returns(mappedCollection);

            _mapperMock.Setup(m => m.Map<ICollection<ResponseDTOProduct>>(products))
                .Returns(mappedProducts);

            // Act
            var result = await _service.GetProductCollectionById(collectionId);

            // Assert
            Assert.Equal(collectionId, result.ProductCollectionId);
            Assert.Equal(2, result.Products.Count);
            Assert.Contains(result.Products, p => p.Id == "P1" && p.ShortDescription == "Short1");
            Assert.Contains(result.Products, p => p.Id == "P2" && p.ShortDescription == "Short2");
        }


        [Fact(DisplayName = "CreateAsync - Uploads image and returns entity")]
        public async Task CreateAsync_UploadsImageAndReturnsEntity()
        {
            var fileMock = new Mock<IFormFile>();
            var ms = new MemoryStream();
            var writer = new StreamWriter(ms);
            writer.Write("dummy");
            writer.Flush();
            ms.Position = 0;

            fileMock.Setup(f => f.OpenReadStream()).Returns(ms);
            fileMock.Setup(f => f.FileName).Returns("test.jpg");

            var uploadResult = new ImageUploadResult { SecureUrl = new Uri("http://cloudinary/test.jpg") };
            _cloudinaryMock.Setup(c => c.UploadAsync(It.IsAny<ImageUploadParams>(), default))
                .ReturnsAsync(uploadResult);

            _unitOfWorkMock.Setup(u => u.ProductCollections.GetProductsByIdsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<Product>());

            _unitOfWorkMock.Setup(u => u.ProductCollections.AddAsync(It.IsAny<ProductCollection>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.ProductCollections.SaveChangesAsync())
                .Returns(Task.CompletedTask);

            var dto = new RequestDTOCreateProductCollection
            {
                Title = "Test Collection",
                Headline = "Headline",
                Content = "Content",
                ImageFile = fileMock.Object,
                CreatedById = "User1",
                ProductIds = new List<string> { "P1", "P2" }
            };

            var result = await _service.CreateAsync(dto);

            Assert.Equal("Test Collection", result.Title);
            Assert.NotNull(result.Image);
        }

        [Fact(DisplayName = "SoftDeleteProductCollectionAsync - Success")]
        public async Task SoftDeleteProductCollectionAsync_Success()
        {
            var collection = new ProductCollection { ProductCollectionId = 1, IsActive = true };
            _unitOfWorkMock.Setup(u => u.ProductCollections.GetByIdAsync(1))
                .ReturnsAsync(collection);

            _unitOfWorkMock.Setup(u => u.ProductCollections.SoftDeleteAsync(collection))
                .Returns(Task.CompletedTask);

            var result = await _service.SoftDeleteProductCollectionAsync(1, "Updater");
            Assert.True(result);
            Assert.Equal("Updater", collection.UpdatedById);
        }

        [Fact(DisplayName = "SoftDeleteProductCollectionAsync - Collection not found or inactive")]
        public async Task SoftDeleteProductCollectionAsync_NotFoundOrInactive()
        {
            _unitOfWorkMock.Setup(u => u.ProductCollections.GetByIdAsync(1))
                .ReturnsAsync((ProductCollection)null);

            var result = await _service.SoftDeleteProductCollectionAsync(1, "Updater");
            Assert.False(result);

            _unitOfWorkMock.Setup(u => u.ProductCollections.GetByIdAsync(2))
                .ReturnsAsync(new ProductCollection { ProductCollectionId = 2, IsActive = false });

            var result2 = await _service.SoftDeleteProductCollectionAsync(2, "Updater");
            Assert.False(result2);
        }

        [Fact(DisplayName = "UpdateProductCollectionAsync - Updates successfully")]
        public async Task UpdateProductCollectionAsync_Success()
        {
            var entity = new ProductCollection { ProductCollectionId = 1 };
            _unitOfWorkMock.Setup(u => u.ProductCollections.GetByIdAsync(1))
                .ReturnsAsync(entity);

            _unitOfWorkMock.Setup(u => u.ProductCollections.UpdateAsync(entity, It.IsAny<List<string>>()))
                .Returns(Task.CompletedTask);

            var dto = new RequestDTOUpdateProductCollection
            {
                ProductCollectionId = 1,
                Title = "New Title",
                Headline = "Headline",
                Content = "Content",
                Image = null,
                ProductIds = new List<string> { "P1", "P2" }
            };

            var result = await _service.UpdateProductCollectionAsync(dto, "Updater");

            Assert.True(result);
            Assert.Equal("New Title", entity.Title);
        }

        [Fact(DisplayName = "UpdateProductCollectionAsync - Collection not found returns false")]
        public async Task UpdateProductCollectionAsync_NotFound()
        {
            _unitOfWorkMock.Setup(u => u.ProductCollections.GetByIdAsync(1))
                .ReturnsAsync((ProductCollection)null);

            var dto = new RequestDTOUpdateProductCollection { ProductCollectionId = 1 };
            var result = await _service.UpdateProductCollectionAsync(dto, "Updater");

            Assert.False(result);
        }

        [Fact(DisplayName = "GenerateID - Returns ID with prefix and timestamp")]
        public void GenerateID_ReturnsCorrectFormat()
        {
            string prefix = "PC";
            string id = ProductCollectionServicesImpl.GenerateID(prefix);

            Assert.StartsWith(prefix + "-", id);
            string timestampPart = id.Substring(prefix.Length + 1);
            Assert.True(DateTime.TryParseExact(timestampPart, "yyyyMMdd-HHmmss", null, System.Globalization.DateTimeStyles.None, out _));
        }
    }
}
