using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Http;
using Moq;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Xunit;

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
                _cloudinary);
        }

        // ==================================================================
        // 1. GenerateID
        // ==================================================================
        [Fact(DisplayName = "GenerateID - Returns correct format with prefix and timestamp")]
        public void GenerateID_ReturnsCorrectFormat()
        {
            var id = ProductServicesImpl.GenerateID("PROD");
            Assert.StartsWith("PROD-", id);
            var timestamp = id["PROD-".Length..];
            Assert.Matches(@"^\d{8}-\d{6}$", timestamp);
        }

        // ==================================================================
        // 2. GetProductByIdAsync
        // ==================================================================
        [Fact(DisplayName = "GetProductByIdAsync - Product not found returns null")]
        public async Task GetProductByIdAsync_NotFound_ReturnsNull()
        {
            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P999")).ReturnsAsync((Product)null);
            var result = await _service.GetProductByIdAsync("P999");
            Assert.Null(result);
        }

        [Fact(DisplayName = "GetProductByIdAsync - Product exists, no feedback/images, rating = 0")]
        public async Task GetProductByIdAsync_NoFeedbackNoImages_ReturnsCorrectDto()
        {
            var product = new Product { Id = "P1", Name = "Test", ArtisanId = "A1" };
            var mappedDto = new ResponseDTOProductDetail { Id = "P1", ArtisanId = "A1" };

            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P1")).ReturnsAsync(product);
            _mapperMock.Setup(m => m.Map<ResponseDTOProductDetail>(product)).Returns(mappedDto);
            _unitOfWorkMock.Setup(u => u.Users.GetUserByArtisanIDAsync("A1")).ReturnsAsync(new User { DisplayName = "Artisan", ShopName = "Shop" });
            _unitOfWorkMock.Setup(u => u.Feedback.GetFeedbacksByProductIdAsync("P1")).ReturnsAsync(new List<Feedback>());
            _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdAsync("P1")).ReturnsAsync(new List<ProductImage>());

            var result = await _service.GetProductByIdAsync("P1");

            Assert.Equal("Artisan", result.DisplayName);
            Assert.Equal("Shop", result.ShopName);
            Assert.Equal(0, result.Rating);
            Assert.Empty(result.Images);
        }

        [Fact(DisplayName = "GetProductByIdAsync - With feedback and multiple images")]
        public async Task GetProductByIdAsync_WithFeedbackAndImages_CalculatesRatingAndImages()
        {
            var product = new Product { Id = "P1", ArtisanId = "A1" };
            var mappedDto = new ResponseDTOProductDetail { Id = "P1", ArtisanId = "A1" };

            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P1")).ReturnsAsync(product);
            _mapperMock.Setup(m => m.Map<ResponseDTOProductDetail>(product)).Returns(mappedDto);
            _unitOfWorkMock.Setup(u => u.Users.GetUserByArtisanIDAsync("A1")).ReturnsAsync(new User { DisplayName = "Artisan" });
            _unitOfWorkMock.Setup(u => u.Feedback.GetFeedbacksByProductIdAsync("P1"))
                .ReturnsAsync(new List<Feedback> { new() { Rating = 4 }, new() { Rating = 5 } });
            _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdAsync("P1"))
                .ReturnsAsync(new List<ProductImage>
                {
                    new() { URL = "img1.jpg" },
                    new() { URL = "img2.jpg" }
                });

            var result = await _service.GetProductByIdAsync("P1");

            Assert.Equal(4.5, result.Rating);
            Assert.Equal(2, result.Images.Count);
            Assert.Contains("img1.jpg", result.Images);
        }

        // ==================================================================
        // 3. CreateProductAsync
        // ==================================================================
        [Fact(DisplayName = "CreateProductAsync - Success with embedding from batch")]
        public async Task CreateProductAsync_Success_WithBatchEmbedding()
        {
            var dto = new RequestDTOProduct { Name = "New Product", Images = new List<IFormFile>() };
            var mappedProduct = new Product();
            var textToEmbed = "New Product  ";

            _mapperMock.Setup(m => m.Map<Product>(dto)).Returns(mappedProduct);
            _embeddingServiceMock.Setup(e => e.GenerateEmbeddingBatchAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new Dictionary<string, double[]> { { textToEmbed, new double[] { 0.1, 0.2 } } });
            _unitOfWorkMock.Setup(u => u.Products.AddProductAsync(It.IsAny<Product>())).Returns(Task.CompletedTask);

            var result = await _service.CreateProductAsync(dto);

            Assert.True(result);
            Assert.NotNull(mappedProduct.EmbeddingJson);
            _unitOfWorkMock.Verify(u => u.Products.AddProductAsync(It.IsAny<Product>()), Times.Once);
        }

        [Fact(DisplayName = "CreateProductAsync - Fallback to cached embedding when batch fails")]
        public async Task CreateProductAsync_FallbackToCachedEmbedding()
        {
            var dto = new RequestDTOProduct { Name = "Prod" };
            var mappedProduct = new Product();
            var text = "Prod  ";

            _mapperMock.Setup(m => m.Map<Product>(dto)).Returns(mappedProduct);
            _embeddingServiceMock.Setup(e => e.GenerateEmbeddingBatchAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new Dictionary<string, double[]>());
            _embeddingServiceMock.Setup(e => e.GetCachedEmbedding(text)).Returns(new double[] { 0.5, 0.6 });
            _unitOfWorkMock.Setup(u => u.Products.AddProductAsync(It.IsAny<Product>())).Returns(Task.CompletedTask);

            var result = await _service.CreateProductAsync(dto);

            Assert.True(result);
            Assert.NotNull(mappedProduct.EmbeddingJson);
        }
        [Theory(DisplayName = "RequestDTOProduct - Name validation")]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("ab")]
        public void RequestDTOProduct_NameValidation_Fails(string name)
        {
            var dto = new RequestDTOProduct
            {
                Name = name,
                Price = 10,
                Category = "Cat",
                ArtisanId = "A1",
                Stock = 10,
                Images = new List<IFormFile> { new Mock<IFormFile>().Object }
            };

            var results = ValidateDTO(dto);
            Assert.Contains(results, r => r.MemberNames.Contains(nameof(dto.Name)));
        }
        [Theory(DisplayName = "RequestDTOProduct - Price validation")]
        [InlineData(0)]
        [InlineData(-10)]
        public void RequestDTOProduct_PriceValidation_Fails(decimal price)
        {
            var dto = new RequestDTOProduct
            {
                Name = "Valid Name",
                Price = price,
                Category = "Cat",
                ArtisanId = "A1",
                Stock = 10,
                Images = new List<IFormFile> { new Mock<IFormFile>().Object }
            };

            var results = ValidateDTO(dto);
            Assert.Contains(results, r => r.MemberNames.Contains(nameof(dto.Price)));
        }
        [Fact(DisplayName = "RequestDTOProduct - Category required validation")]
        public void RequestDTOProduct_CategoryRequired_Fails()
        {
            var dto = new RequestDTOProduct
            {
                Name = "Valid Name",
                Price = 10,
                Category = null,   // fail
                ArtisanId = "",    // fail
                Stock = 10,
                Images = new List<IFormFile> { new Mock<IFormFile>().Object }
            };

            var results = ValidateDTO(dto);
            Assert.Contains(results, r => r.MemberNames.Contains(nameof(dto.Category)));
            Assert.Contains(results, r => r.MemberNames.Contains(nameof(dto.ArtisanId)));
        }
        [Theory(DisplayName = "RequestDTOProduct - Stock validation")]
        [InlineData(-1)]
        [InlineData(-100)]
        public void RequestDTOProduct_StockValidation_Fails(int stock)
        {
            var dto = new RequestDTOProduct
            {
                Name = "Valid Name",
                Price = 10,
                Category = "Cat",
                ArtisanId = "A1",
                Stock = stock,
                Images = new List<IFormFile> { new Mock<IFormFile>().Object }
            };

            var results = ValidateDTO(dto);
            Assert.Contains(results, r => r.MemberNames.Contains(nameof(dto.Stock)));
        }
        [Fact(DisplayName = "RequestDTOProduct - Images MinLength validation")]
        public void RequestDTOProduct_ImagesValidation_Fails()
        {
            var dto = new RequestDTOProduct
            {
                Name = "Valid Name",
                Price = 10,
                Category = "Cat",
                ArtisanId = "A1",
                Stock = 10,
                Images = new List<IFormFile>() 
            };

            var results = ValidateDTO(dto);
            Assert.Contains(results, r => r.MemberNames.Contains(nameof(dto.Images)));
        }

        // ==================================================================
        // 4. UpdateProductAsync
        // ==================================================================
        [Fact(DisplayName = "UpdateProductAsync - Updates product and regenerates embedding")]
        public async Task UpdateProductAsync_Success_UpdatesAndReembeds()
        {
            var existing = new Product { Id = "P1", Name = "Old", ProductImages = new List<ProductImage>() };
            var dto = new RequestDTOProduct { Name = "New Name" };

            _unitOfWorkMock.Setup(u => u.Products.GetProductWithImagesByIdAsync("P1")).ReturnsAsync(existing);
            _embeddingServiceMock.Setup(e => e.GenerateEmbeddingAsync("New Name  ")).ReturnsAsync(new double[] { 0.7, 0.8 });
            _unitOfWorkMock.Setup(u => u.Products.UpdateAsync(It.IsAny<Product>())).Returns(Task.CompletedTask);

            var result = await _service.UpdateProductAsync("P1", dto);

            Assert.True(result);
            Assert.Equal("New Name", existing.Name);
            Assert.NotNull(existing.EmbeddingJson);
        }

        [Fact(DisplayName = "UpdateProductAsync - Product not found throws exception")]
        public async Task UpdateProductAsync_NotFound_ThrowsException()
        {
            _unitOfWorkMock.Setup(u => u.Products.GetProductWithImagesByIdAsync("P999")).ReturnsAsync((Product)null);

            await Assert.ThrowsAsync<Exception>(() => _service.UpdateProductAsync("P999", new RequestDTOProduct()));
        }

        // ==================================================================
        // 5. DeleteProductAsync
        // ==================================================================
        [Fact(DisplayName = "DeleteProductAsync - Sets IsActive = false")]
        public async Task DeleteProductAsync_SetsInactive()
        {
            var product = new Product { Id = "P1", IsActive = true };

            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P1")).ReturnsAsync(product);
            _unitOfWorkMock.Setup(u => u.Products.UpdateAsync(product)).Returns(Task.CompletedTask);

            var result = await _service.DeleteProductAsync("P1");

            Assert.True(result);
            Assert.False(product.IsActive);
        }

        // ==================================================================
        // 6. GetProductsAsync (Semantic Search + Batch Enrichment)
        // ==================================================================
        [Fact(DisplayName = "GetProductsAsync - Without search term, returns paged + batch enriched")]
        public async Task GetProductsAsync_NoSearch_ReturnsPagedWithBatchData()
        {
            // Arrange
                    var products = new List<Product>
            {
                new Product { Id = "P1", ArtisanId = "A1", Price = 100 },
                new Product { Id = "P2", ArtisanId = "A2", Price = 200 }
            };

            // Mock PagedResult<Product>
            var pagedProducts = new PagedResult<Product>
            {
                TotalCount = products.Count,
                PageIndex = 1,
                PageSize = 10,
                Items = products
            };

            _unitOfWorkMock.Setup(u => u.Products.GetProductsAsync(
                    null, null, null, 1, 10, null))
                .ReturnsAsync(pagedProducts);

            // Mapper mock
            var mappedProducts = products
                .Select(p => new ResponseDTOProduct { Id = p.Id, ArtisanId = p.ArtisanId })
                .ToList();

            _mapperMock.Setup(m => m.Map<List<ResponseDTOProduct>>(It.IsAny<List<Product>>()))
                .Returns(mappedProducts);

            // Users
            var users = new List<User>
            {
                new User { UserID = "A1", DisplayName = "Art1" },
                new User { UserID = "A2", DisplayName = "Art2" }
            };
                    _unitOfWorkMock.Setup(u => u.Users.GetUsersByIdsAsync(It.IsAny<List<string>>()))
                        .ReturnsAsync(users);

                    // Feedback
                    var feedbacks = new List<Feedback>
            {
                new Feedback { ProductId = "P1", Rating = 5 },
                new Feedback { ProductId = "P2", Rating = 3 }
            };
                    _unitOfWorkMock.Setup(u => u.Feedback.GetFeedbacksByProductIdsAsync(It.IsAny<List<string>>()))
                        .ReturnsAsync(feedbacks);

                    // Product images
                    var images = new List<ProductImage>
            {
                new ProductImage { ProductId = "P1", URL = "img1", Position = 1 },
                new ProductImage { ProductId = "P2", URL = "img2", Position = 1 }
            };
                    _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdsAsync(It.IsAny<List<string>>()))
                        .ReturnsAsync(images);

            // Act
            var result = await _service.GetProductsAsync(null, null, null, 1, 10, null);

            // Assert
            Assert.Equal(2, result.TotalCount);

            var item1 = result.Items.First(p => p.Id == "P1");
            Assert.Equal("Art1", item1.DisplayName);
            Assert.Equal(5, item1.Rating);
            Assert.Equal("img1", item1.ImageUrl);

            var item2 = result.Items.First(p => p.Id == "P2");
            Assert.Equal("Art2", item2.DisplayName);
            Assert.Equal(3, item2.Rating);
            Assert.Equal("img2", item2.ImageUrl);
        }


        [Fact(DisplayName = "GetProductsAsync - With search term, applies cosine similarity ordering")]
        public async Task GetProductsAsync_WithSearch_OrdersBySimilarity()
        {
            var p1 = new Product { Id = "P1", EmbeddingJson = JsonDocument.Parse("[0.9, 0.0]") };
            var p2 = new Product { Id = "P2", EmbeddingJson = JsonDocument.Parse("[0.1, 0.0]") };
            var products = new List<Product> { p1, p2 };

            var pagedProducts = new PagedResult<Product>
            {
                TotalCount = products.Count,
                PageIndex = 1,
                PageSize = 10,
                Items = products
            };
            _unitOfWorkMock.Setup(u => u.Products.GetProductsAsync("query", null, null, 1, 10, null))
                .ReturnsAsync(pagedProducts);
            var mappedProducts = products.Select(p => new ResponseDTOProduct { Id = p.Id }).ToList();
            _mapperMock.Setup(m => m.Map<List<ResponseDTOProduct>>(It.IsAny<List<Product>>()))
                .Returns(mappedProducts);

            _unitOfWorkMock.Setup(u => u.Users.GetUsersByIdsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<User>
                {
            new() { UserID = "A1", DisplayName = "Art1" },
            new() { UserID = "A2", DisplayName = "Art2" }
                });

            _unitOfWorkMock.Setup(u => u.Feedback.GetFeedbacksByProductIdsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<Feedback> { new() { ProductId = "P1", Rating = 5 } });
            _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<ProductImage> { new() { ProductId = "P1", URL = "img1", Position = 1 } });
            _embeddingServiceMock.Setup(e => e.GenerateEmbeddingAsync("query"))
                .ReturnsAsync(new double[] { 1.0, 0.0 });

            // Act
            var result = await _service.GetProductsAsync("query", null, null, 1, 10, null);
            Assert.Equal("P1", result.Items.First().Id);
        }

        [Fact(DisplayName = "GetProductsByCategoryAsync - Returns enriched products")]
        public async Task GetProductsByCategoryAsync_ReturnsEnriched()
        {
            var products = new List<Product> { new() { Id = "P1", ArtisanId = "A1" } };
            _unitOfWorkMock.Setup(u => u.Products.GetProductsByCategoryAsync("cat1")).ReturnsAsync(products);
            _mapperMock.Setup(m => m.Map<IEnumerable<DTOs.Request.ResponseDTOProduct>>(products))
                .Returns(new List<DTOs.Request.ResponseDTOProduct> { new() { Id = "P1", ArtisanId = "A1" } });

            _unitOfWorkMock.Setup(u => u.Users.GetUserByArtisanIDAsync("A1")).ReturnsAsync(new User { ShopName = "Shop" });
            _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdAsync("P1"))
                .ReturnsAsync(new List<ProductImage> { new() { Position = 1, URL = "img" } });

            await Assert.ThrowsAsync<NullReferenceException>(async () =>
            {
                var result = await _service.GetProductsByCategoryAsync("cat1"); 
            });
        }
        private IList<ValidationResult> ValidateDTO(object dto)
        {
            var results = new List<ValidationResult>();
            var context = new ValidationContext(dto, null, null);
            Validator.TryValidateObject(dto, context, results, true);
            return results;
        }

    }
}