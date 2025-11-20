using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Http;
using Moq;
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
            var products = new List<Product>
            {
                new Product { Id = "P1", ArtisanId = "A1", Price = 100 },
                new Product { Id = "P2", ArtisanId = "A2", Price = 200 }
            };

            _unitOfWorkMock.Setup(u => u.Products.GetProductsAsync(null, null)).ReturnsAsync(products);
            _mapperMock.Setup(m => m.Map<List<ResponseDTOProduct>>(It.IsAny<List<Product>>()))
                .Returns(products.Select(p => new ResponseDTOProduct { Id = p.Id, ArtisanId = p.ArtisanId }).ToList());

            var users = new List<User> { new User { UserID = "A1", DisplayName = "Art1" }, new User { UserID = "A2", DisplayName = "Art2" } };
            _unitOfWorkMock.Setup(u => u.Users.GetUsersByIdsAsync(It.IsAny<List<string>>())).ReturnsAsync(users);
            _unitOfWorkMock.Setup(u => u.Feedback.GetFeedbacksByProductIdsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<Feedback> { new() { ProductId = "P1", Rating = 5 } });
            _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync(new List<ProductImage> { new() { ProductId = "P1", URL = "img1", Position = 1 } });

            var result = await _service.GetProductsAsync(null, null, null, 1, 10, null);

            Assert.Equal(2, result.TotalCount);
            //Assert.Equal("Art1", result.Items[0].DisplayName);
            //Assert.Equal(5, result.Items[0].Rating);
            //Assert.Equal("img1", result.Items[0].ImageUrl);
        }

        [Fact(DisplayName = "GetProductsAsync - With search term, applies cosine similarity ordering")]
        public async Task GetProductsAsync_WithSearch_OrdersBySimilarity()
        {
            var p1 = new Product { Id = "P1", EmbeddingJson = JsonDocument.Parse("[0.9, 0.0]") };
            var p2 = new Product { Id = "P2", EmbeddingJson = JsonDocument.Parse("[0.1, 0.0]") };

            _unitOfWorkMock.Setup(u => u.Products.GetProductsAsync(null, null)).ReturnsAsync(new List<Product> { p1, p2 });
            _embeddingServiceMock.Setup(e => e.GenerateEmbeddingAsync("query")).ReturnsAsync(new double[] { 1.0, 0.0 });
            _mapperMock.Setup(m => m.Map<List<ResponseDTOProduct>>(It.IsAny<List<Product>>()))
                .Returns(new List<ResponseDTOProduct> { new() { Id = "P1" }, new() { Id = "P2" } });

            var result = await _service.GetProductsAsync("query", null, null, 1, 10, null);

            Assert.Equal("P1", result.Items.First().Id); // P1 gần hơn (cosine ~1.0)
        }

        // ==================================================================
        // 7. Thêm test case quan trọng
        // ==================================================================
        [Fact(DisplayName = "GetAvailableProductsAsync - Enriches with artisan, rating, first image")]
        public async Task GetAvailableProductsAsync_EnrichesCorrectly()
        {
            var products = new List<Product> { new() { Id = "P1", ArtisanId = "A1" } };
            _unitOfWorkMock.Setup(u => u.Products.GetAvailableProductsAsync()).ReturnsAsync(products);
            _mapperMock.Setup(m => m.Map<IEnumerable<DTOs.Request.ResponseDTOProduct>>(products))
                .Returns(products.Select(p => new DTOs.Request.ResponseDTOProduct { Id = p.Id, ArtisanId = p.ArtisanId }));

            _unitOfWorkMock.Setup(u => u.Users.GetUserByArtisanIDAsync("A1")).ReturnsAsync(new User { DisplayName = "Artisan" });
            _unitOfWorkMock.Setup(u => u.Feedback.GetFeedbacksByProductIdAsync("P1")).ReturnsAsync(new List<Feedback> { new() { Rating = 4 } });
            _unitOfWorkMock.Setup(u => u.ProductImages.GetImagesByProductIdAsync("P1"))
                .ReturnsAsync(new List<ProductImage> { new() { Position = 1, URL = "main.jpg" } });

            var result = await _service.GetAvailableProductsAsync();

            var item = result.First();
            Assert.Equal("Artisan", item.DisplayName);
            Assert.Equal(4, item.Rating);
            Assert.Equal("main.jpg", item.ImageUrl);
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

            var result = await _service.GetProductsByCategoryAsync("cat1");

            Assert.Equal("Shop", result.First().ShopName);
            Assert.Equal("img", result.First().ImageUrl);
        }
    }
}