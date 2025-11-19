using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using CloudinaryDotNet;
using Moq;
using System.Text.Json;

namespace Backend_SEP490.UnitTests
{
    public class ProductUnitTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IEmbeddingService> _embeddingServiceMock;
        private readonly Mock<IUserServices> _userServiceMock;
        private readonly Mock<IFeedbackServices> _feedbackServiceMock;
        private readonly Mock<IProductImagesServices> _productImagesServiceMock;
        private readonly Cloudinary _cloudinary;
        private readonly ProductServicesImpl _service;

        public ProductUnitTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _embeddingServiceMock = new Mock<IEmbeddingService>();
            _userServiceMock = new Mock<IUserServices>();
            _feedbackServiceMock = new Mock<IFeedbackServices>();
            _productImagesServiceMock = new Mock<IProductImagesServices>();
            _cloudinary = new Cloudinary(new Account("dummy", "dummy", "dummy"));

            _service = new ProductServicesImpl(
                _mapperMock.Object,
                _unitOfWorkMock.Object,
                _embeddingServiceMock.Object,
                _userServiceMock.Object,
                _feedbackServiceMock.Object,
                _productImagesServiceMock.Object,
                _cloudinary
            );
        }

        [Fact(DisplayName = "GenerateID - Returns correct format")]
        public void GenerateID_ReturnsCorrectFormat()
        {
            var prefix = "PROD";
            var id = ProductServicesImpl.GenerateID(prefix);

            Assert.StartsWith(prefix + "-", id);
            var timestampPart = id.Substring(prefix.Length + 1);
            Assert.True(DateTime.TryParseExact(timestampPart, "yyyyMMdd-HHmmss", null, System.Globalization.DateTimeStyles.None, out _));
        }


        [Fact(DisplayName = "GetProductByIdAsync - Returns null if product not found")]
        public async Task GetProductByIdAsync_ProductNotFound_ReturnsNull()
        {
            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P1"))
                .ReturnsAsync((Product)null);

            var result = await _service.GetProductByIdAsync("P1");

            Assert.Null(result);
        }
        // Product exists but no feedback and no images
        [Fact(DisplayName = "GetProductByIdAsync - Product exists without feedback and images")]
        public async Task GetProductByIdAsync_ProductExistsNoFeedbackNoImages_ReturnsProduct()
        {
            var product = new Product
            {
                Id = "P1",
                Name = "Test Product",
                ArtisanId = "A1",
                Price = 10,
                Stock = 5,
                Category = "Cat1",
                IsActive = true
            };

            var dtoProduct = new ResponseDTOProductDetail
            {
                Id = product.Id,
                Name = product.Name,
                ArtisanId = product.ArtisanId,
                Category = product.Category,
                Price = product.Price,
                Stock = product.Stock,
                Images = new List<string>()
            };

            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P1")).ReturnsAsync(product);
            _mapperMock.Setup(m => m.Map<ResponseDTOProductDetail>(product)).Returns(dtoProduct);
            _unitOfWorkMock.Setup(u => u.Users.GetUserByArtisanIDAsync("A1")).ReturnsAsync(new User { DisplayName = "Art1", ShopName = "Shop1" });
            _unitOfWorkMock.Setup(u => u.Feedback.GetFeedbacksByProductIdAsync("P1")).ReturnsAsync(new List<Feedback>());
            _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdAsync("P1")).ReturnsAsync(new List<ProductImage>());

            var result = await _service.GetProductByIdAsync("P1");

            Assert.NotNull(result);
            Assert.Equal("Test Product", result.Name);
            Assert.Equal("Art1", result.DisplayName);
            Assert.Equal("Shop1", result.ShopName);
            Assert.Equal(0, result.Rating);  // no feedback
            Assert.Empty(result.Images);     // no images
        }

        // Product exists with feedback and images
        [Fact(DisplayName = "GetProductByIdAsync - Product exists with feedback and images")]
        public async Task GetProductByIdAsync_ProductExistsWithFeedbackAndImages_ReturnsProduct()
        {
            var product = new Product
            {
                Id = "P1",
                Name = "Test Product",
                ArtisanId = "A1",
                Price = 10,
                Stock = 5,
                Category = "Cat1",
                IsActive = true
            };

            var dtoProduct = new ResponseDTOProductDetail
            {
                Id = product.Id,
                Name = product.Name,
                ArtisanId = product.ArtisanId,
                Category = product.Category,
                Price = product.Price,
                Stock = product.Stock,
                Images = new List<string>()
            };

            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P1")).ReturnsAsync(product);
            _mapperMock.Setup(m => m.Map<ResponseDTOProductDetail>(product)).Returns(dtoProduct);
            _unitOfWorkMock.Setup(u => u.Users.GetUserByArtisanIDAsync("A1")).ReturnsAsync(new User { DisplayName = "Art1", ShopName = "Shop1" });
            _unitOfWorkMock.Setup(u => u.Feedback.GetFeedbacksByProductIdAsync("P1")).ReturnsAsync(new List<Feedback>
            {
                new Feedback { Rating = 4 },
                new Feedback { Rating = 5 }
            });
                    _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdAsync("P1")).ReturnsAsync(new List<ProductImage>
            {
                new ProductImage { URL = "url1" },
                new ProductImage { URL = "url2" }
            });

            var result = await _service.GetProductByIdAsync("P1");

            Assert.NotNull(result);
            Assert.Equal(4.5, result.Rating); // average of 4 and 5
            Assert.Equal(2, result.Images.Count);
            Assert.Contains("url1", result.Images);
            Assert.Contains("url2", result.Images);
            Assert.Equal("Art1", result.DisplayName);
            Assert.Equal("Shop1", result.ShopName);
        }

        [Fact(DisplayName = "GetProductByIdAsync - Maps product with ratings and images")]
        public async Task GetProductByIdAsync_MapsProductCorrectly()
        {
            var product = new Product { Id = "P1", ArtisanId = "A1", IsActive = true };
            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P1"))
                .ReturnsAsync(product);

            _mapperMock.Setup(m => m.Map<ResponseDTOProductDetail>(product))
                .Returns(new ResponseDTOProductDetail { Id = "P1", ArtisanId = "A1" });

            _unitOfWorkMock.Setup(u => u.Users.GetUserByArtisanIDAsync("A1"))
                .ReturnsAsync(new User { DisplayName = "Art1", ShopName = "Shop1" });

            _unitOfWorkMock.Setup(u => u.Feedback.GetFeedbacksByProductIdAsync("P1"))
                .ReturnsAsync(new List<Feedback> { new Feedback { Rating = 5 } });

            _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdAsync("P1"))
                .ReturnsAsync(new List<ProductImage> { new ProductImage { URL = "img1" }, new ProductImage { URL = "img2" } });

            var result = await _service.GetProductByIdAsync("P1");

            Assert.Equal("Art1", result.DisplayName);
            Assert.Equal("Shop1", result.ShopName);
            Assert.Equal(5, result.Rating);
            Assert.Equal(2, result.Images.Count);
        }

        [Fact(DisplayName = "CreateProductAsync - Successful creation with embedding")]
        public async Task CreateProductAsync_Success()
        {
            var dto = new RequestDTOProduct
            {
                Name = "Prod1",
                Category = "Cat1",
                Price = 10,
                ArtisanId = "A1",
                Stock = 5
            };

            _mapperMock.Setup(m => m.Map<Product>(dto))
                .Returns(new Product());

            _embeddingServiceMock.Setup(e => e.GenerateEmbeddingBatchAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new Dictionary<string, double[]> { { "Prod1  ", new double[] { 0.1, 0.2 } } });

            _unitOfWorkMock.Setup(u => u.Products.AddProductAsync(It.IsAny<Product>()))
                .Returns(Task.CompletedTask);

            var result = await _service.CreateProductAsync(dto);

            Assert.True(result);
        }

        [Fact(DisplayName = "UpdateProductAsync - Updates existing product")]
        public async Task UpdateProductAsync_UpdatesProduct()
        {
            var product = new Product { Id = "P1", Name = "OldName" };
            var dto = new RequestDTOProduct
            {
                Name = "NewName",
                Category = "Cat1",
                Price = 10,
                ArtisanId = "A1",
                Stock = 5
            };

            _unitOfWorkMock.Setup(u => u.Products.GetProductWithImagesByIdAsync("P1"))
                .ReturnsAsync(product);

            _embeddingServiceMock.Setup(e => e.GenerateEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new double[] { 0.1, 0.2 });

            _unitOfWorkMock.Setup(u => u.Products.UpdateAsync(It.IsAny<Product>()))
                .Returns(Task.CompletedTask);

            var result = await _service.UpdateProductAsync("P1", dto);

            Assert.True(result);
            Assert.Equal("NewName", product.Name);
        }

        [Fact(DisplayName = "UpdateProductAsync - Throws exception if product not found")]
        public async Task UpdateProductAsync_ProductNotFound_Throws()
        {
            _unitOfWorkMock.Setup(u => u.Products.GetProductWithImagesByIdAsync("P1"))
                .ReturnsAsync((Product)null);

            await Assert.ThrowsAsync<Exception>(async () =>
                await _service.UpdateProductAsync("P1", new RequestDTOProduct()));
        }

        [Fact(DisplayName = "DeleteProductAsync - Marks product as inactive")]
        public async Task DeleteProductAsync_MarksInactive()
        {
            var product = new Product { Id = "P1", IsActive = true };
            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P1"))
                .ReturnsAsync(product);
            _unitOfWorkMock.Setup(u => u.Products.UpdateAsync(product))
                .Returns(Task.CompletedTask);

            var result = await _service.DeleteProductAsync("P1");

            Assert.True(result);
            Assert.False(product.IsActive);
        }

        [Fact(DisplayName = "GetProductsAsync - Pagination and cosine similarity")]
        public async Task GetProductsAsync_PaginationAndSimilarity()
        {
            var products = new List<Product>
            {
                new Product { Id = "P1", EmbeddingJson = JsonDocument.Parse("[0.1,0.2]") },
                new Product { Id = "P2", EmbeddingJson = JsonDocument.Parse("[0.3,0.4]") }
            };

            _unitOfWorkMock.Setup(u => u.Products.GetProductsAsync(null, null))
                .ReturnsAsync(products);

            _embeddingServiceMock.Setup(e => e.GenerateEmbeddingAsync(It.IsAny<string>()))
                .ReturnsAsync(new double[] { 0.1, 0.2 });

            _mapperMock.Setup(m => m.Map<List<ResponseDTOProduct>>(It.IsAny<List<Product>>()))
                .Returns((List<Product> p) => p.Select(x => new ResponseDTOProduct { Id = x.Id }).ToList());

            _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdAsync(It.IsAny<string>()))
                .ReturnsAsync(new List<ProductImage> { new ProductImage { URL = "url", Position = 0 } });

            var result = await _service.GetProductsAsync("query", null, null, 1, 10);

            Assert.Equal(2, result.TotalCount);
            Assert.All(result.Items, p => Assert.Equal("url", p.ImageUrl));
        }
    }
}
