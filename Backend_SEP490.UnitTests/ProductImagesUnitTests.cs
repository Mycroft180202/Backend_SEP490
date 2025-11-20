using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using CloudinaryDotNet;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace Backend_SEP490.UnitTests
{
    public class ProductImagesUnitTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ProductImagesServicesImpl _service;
        private readonly Cloudinary _cloudinary;

        public ProductImagesUnitTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _cloudinary = new Cloudinary(new Account("dummy", "dummy", "dummy"));
            _service = new ProductImagesServicesImpl(_mapperMock.Object, _unitOfWorkMock.Object, _cloudinary);
        }

        [Fact(DisplayName = "GetImagesByProductIdAsync - Returns mapped images")]
        public async Task GetImagesByProductIdAsync_ReturnsMappedImages()
        {
            string productId = "P-01";
            var images = new List<ProductImage>
            {
                new ProductImage { Id = "IMG-01", ProductId = productId, URL = "http://example.com/1.jpg", Position = 1 },
                new ProductImage { Id = "IMG-02", ProductId = productId, URL = "http://example.com/2.jpg", Position = 2 }
            };

            var mappedImages = images.Select(i => new ResponseDTOProductImages
            {
                Id = i.Id,
                ProductId = i.ProductId,
                URL = i.URL,
                Position = i.Position
            }).ToList();

            _unitOfWorkMock.Setup(c => c.ProductImages.GetImagesByProductIdAsync(productId))
                .ReturnsAsync(images);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOProductImages>>(images))
                .Returns(mappedImages);

            var result = await _service.GetImagesByProductIdAsync(productId);

            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            Assert.Contains(result, x => x.Id == "IMG-01" && x.Position == 1);
        }

        [Fact(DisplayName = "GetImagesByProductIdAsync - Returns empty list when repository empty")]
        public async Task GetImagesByProductIdAsync_EmptyList_ReturnsEmptyList()
        {
            string productId = "P-02";
            var images = new List<ProductImage>();

            _unitOfWorkMock.Setup(c => c.ProductImages.GetImagesByProductIdAsync(productId))
                .ReturnsAsync(images);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOProductImages>>(images))
                .Returns(new List<ResponseDTOProductImages>());

            var result = await _service.GetImagesByProductIdAsync(productId);

            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact(DisplayName = "GetImagesByProductIdAsync - Returns empty list when repository returns null")]
        public async Task GetImagesByProductIdAsync_Null_ReturnsEmptyList()
        {
            string productId = "P-03";

            _unitOfWorkMock.Setup(c => c.ProductImages.GetImagesByProductIdAsync(productId))
                .ReturnsAsync((List<ProductImage>)null);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOProductImages>>(It.IsAny<IEnumerable<ProductImage>>()))
                .Returns(new List<ResponseDTOProductImages>());

            var result = await _service.GetImagesByProductIdAsync(productId);

            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact(DisplayName = "GetImagesByProductIdAsync - Handles ProductImage with null URL and Position")]
        public async Task GetImagesByProductIdAsync_NullProperties()
        {
            string productId = "P-04";
            var images = new List<ProductImage>
            {
                new ProductImage { Id = "IMG-NULL", ProductId = productId, URL = null, Position = null }
            };

            _unitOfWorkMock.Setup(c => c.ProductImages.GetImagesByProductIdAsync(productId))
                .ReturnsAsync(images);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOProductImages>>(images))
                .Returns(images.Select(i => new ResponseDTOProductImages
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    URL = i.URL,
                    Position = i.Position
                }));

            var result = await _service.GetImagesByProductIdAsync(productId);

            Assert.Single(result);
            Assert.Null(result.First().URL);
            Assert.Null(result.First().Position);
        }

        [Fact(DisplayName = "GetImagesByProductIdAsync - Repository throws exception")]
        public async Task GetImagesByProductIdAsync_RepositoryThrowsException()
        {
            string productId = "P-05";
            _unitOfWorkMock.Setup(c => c.ProductImages.GetImagesByProductIdAsync(productId))
                .ThrowsAsync(new Exception("Database error"));

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOProductImages>>(It.IsAny<IEnumerable<ProductImage>>()))
                .Returns(new List<ResponseDTOProductImages>());

            await Assert.ThrowsAsync<Exception>(async () =>
            {
                await _service.GetImagesByProductIdAsync(productId);
            });
        }

        [Fact(DisplayName = "GetImagesByProductIdAsync - Non-existent ProductId returns empty list")]
        public async Task GetImagesByProductIdAsync_ProductIdNotFound()
        {
            string productId = "NON_EXISTENT";
            _unitOfWorkMock.Setup(c => c.ProductImages.GetImagesByProductIdAsync(productId))
                .ReturnsAsync(new List<ProductImage>());

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOProductImages>>(It.IsAny<IEnumerable<ProductImage>>()))
                .Returns(new List<ResponseDTOProductImages>());

            var result = await _service.GetImagesByProductIdAsync(productId);

            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact(DisplayName = "GenerateID - Returns ID with prefix and timestamp")]
        public void GenerateID_ReturnsCorrectFormat()
        {
            string prefix = "IMG";
            string id = ProductImagesServicesImpl.GenerateID(prefix);

            Assert.StartsWith(prefix + "-", id);

            string timestampPart = id.Substring(prefix.Length + 1);
            Assert.True(DateTime.TryParseExact(timestampPart, "yyyyMMdd-HHmmss", null, System.Globalization.DateTimeStyles.None, out _));
        }
    }
}
