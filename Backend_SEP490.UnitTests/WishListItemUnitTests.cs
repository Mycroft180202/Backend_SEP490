using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Moq;
using Xunit;

namespace Backend_SEP490.UnitTests
{
    public class WishListItemUnitTests
    {
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IWishListItemRepositories> _wishListRepoMock;
        private readonly Mock<ICartRepositories> _cartRepoMock;
        private readonly Mock<IProductRepositories> _productRepoMock;
        private readonly Mock<ICartItemRepositories> _cartItemRepoMock;
        private readonly Mock<IProductImagesRepositories> _productImagesRepoMock;

        private readonly WishListItemServiceImpl _service;

        public WishListItemUnitTests()
        {
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _wishListRepoMock = new Mock<IWishListItemRepositories>();
            _cartRepoMock = new Mock<ICartRepositories>();
            _productRepoMock = new Mock<IProductRepositories>();
            _cartItemRepoMock = new Mock<ICartItemRepositories>();
            _productImagesRepoMock = new Mock<IProductImagesRepositories>();

            _unitOfWorkMock.Setup(u => u.WishListItem).Returns(_wishListRepoMock.Object);
            _unitOfWorkMock.Setup(u => u.Cart).Returns(_cartRepoMock.Object);
            _unitOfWorkMock.Setup(u => u.Products).Returns(_productRepoMock.Object);
            _unitOfWorkMock.Setup(u => u.CartItem).Returns(_cartItemRepoMock.Object);
            _unitOfWorkMock.Setup(u => u.ProductImages).Returns(_productImagesRepoMock.Object);

            _service = new WishListItemServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object);
        }

        // ===============================
        // CreateWishListItemAsync
        // ===============================

        [Fact(DisplayName = "CreateWishListItemAsync - Success - Returns success message")]
        public async Task CreateWishListItemAsync_Success()
        {
            var userId = "U001";
            var productId = "P001";
            var expectedId = $"WLI-{userId}-{productId}";

            _wishListRepoMock.Setup(r => r.CreateWishListItemAsync(It.IsAny<WishListItem>()))
                .ReturnsAsync("Create wishlist item successfully!");

            var result = await _service.CreateWishListItemAsync(userId, productId);

            Assert.Equal("Create wishlist item successfully!", result);
            _wishListRepoMock.Verify(r => r.CreateWishListItemAsync(It.Is<WishListItem>(w =>
                w.Id == expectedId &&
                w.UserID == userId &&
                w.ProductID == productId &&
                w.AddAt != default
            )), Times.Once);
        }

        [Theory(DisplayName = "CreateWishListItemAsync - userId null/empty - Still creates (no validation in code)")]
        [InlineData(null)]
        [InlineData("")]
        public async Task CreateWishListItemAsync_AcceptsNullOrEmptyUserId(string userId)
        {
            _wishListRepoMock.Setup(r => r.CreateWishListItemAsync(It.IsAny<WishListItem>()))
                .ReturnsAsync("Create wishlist item successfully!");

            var result = await _service.CreateWishListItemAsync(userId, "P001");

            Assert.Contains("success", result, StringComparison.OrdinalIgnoreCase);
        }

        [Theory(DisplayName = "CreateWishListItemAsync - productId null/empty - Still creates (no validation in code)")]
        [InlineData(null)]
        [InlineData("")]
        public async Task CreateWishListItemAsync_AcceptsNullOrEmptyProductId(string productId)
        {
            _wishListRepoMock.Setup(r => r.CreateWishListItemAsync(It.IsAny<WishListItem>()))
                .ReturnsAsync("Create wishlist item successfully!");

            var result = await _service.CreateWishListItemAsync("U001", productId);

            Assert.Contains("success", result, StringComparison.OrdinalIgnoreCase);
        }

        // ===============================
        // DeleteWishListItemAsync
        // ===============================

        [Fact(DisplayName = "DeleteWishListItemAsync - Success - Item found and deleted")]
        public async Task DeleteWishListItemAsync_Success()
        {
            var id = "WLI-U001-P001";
            var item = new WishListItem { Id = id };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(id)).ReturnsAsync(item);
            _wishListRepoMock.Setup(r => r.DeleteWishListItemAsync(item))
                .ReturnsAsync("Delete wishlist item successfully!");

            var result = await _service.DeleteWishListItemAsync(id);

            Assert.Equal("Delete wishlist item successfully!", result);
        }

        [Fact(DisplayName = "DeleteWishListItemAsync - Item not found - Returns null (code returns null)")]
        public async Task DeleteWishListItemAsync_NotFound_ReturnsNull()
        {
            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync("INVALID"))
                .ReturnsAsync((WishListItem?)null);

            var result = await _service.DeleteWishListItemAsync("INVALID");

            Assert.Null(result); // Thực tế code hiện tại return null khi không tìm thấy
        }

        [Theory(DisplayName = "DeleteWishListItemAsync - Null or empty id - Returns null (no validation)")]
        [InlineData(null)]
        [InlineData("")]
        public async Task DeleteWishListItemAsync_NullOrEmptyId_ReturnsNull(string id)
        {
            var result = await _service.DeleteWishListItemAsync(id);
            Assert.Null(result);
        }

        // ===============================
        // AddWishListItemToCartAsync
        // ===============================

        [Fact(DisplayName = "AddWishListItemToCartAsync - Item exists in cart, in stock - Updates quantity + deletes wishlist")]
        public async Task AddToCart_UpdatesExistingItem()
        {
            var userId = "U001";
            var wishId = "WLI-U001-P001";
            var productId = "P001";
            var existingCartItem = new CartItem { ProductId = productId, Quantity = 2 };
            var cart = new Cart { Id = "C001", CustomerID = userId, CartItems = new List<CartItem> { existingCartItem } };
            var product = new Product { Id = productId, Stock = 10, Price = 100m };
            var wishItem = new WishListItem { Id = wishId, ProductID = productId };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishId)).ReturnsAsync(wishItem);
            _cartRepoMock.Setup(r => r.GetCartByUserIdAsync(userId)).ReturnsAsync(cart);
            _productRepoMock.Setup(r => r.GetProductByIdAsync(productId)).ReturnsAsync(product);
            _cartItemRepoMock.Setup(r => r.UpdateCartItemAsync(existingCartItem, 3))
                .ReturnsAsync("Quantity updated!");
            _wishListRepoMock.Setup(r => r.DeleteWishListItemAsync(wishItem))
                .ReturnsAsync("Deleted from wishlist!");

            var result = await _service.AddWishListItemToCartAsync(userId, wishId);

            Assert.Equal("Deleted from wishlist!", result);
            _cartItemRepoMock.Verify(r => r.UpdateCartItemAsync(existingCartItem, 3), Times.Once);
            _wishListRepoMock.Verify(r => r.DeleteWishListItemAsync(wishItem), Times.Once);
        }

        [Fact(DisplayName = "AddWishListItemToCartAsync - Out of stock - Returns Out of stock!")]
        public async Task AddToCart_OutOfStock_ReturnsError()
        {
            var userId = "U001";
            var wishId = "WLI-U001-P001";
            var productId = "P001";
            var existingCartItem = new CartItem { ProductId = productId, Quantity = 5 };
            var cart = new Cart { CartItems = new List<CartItem> { existingCartItem } };
            var product = new Product { Id = productId, Stock = 5 };
            var wishItem = new WishListItem { ProductID = productId };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishId)).ReturnsAsync(wishItem);
            _cartRepoMock.Setup(r => r.GetCartByUserIdAsync(userId)).ReturnsAsync(cart);
            _productRepoMock.Setup(r => r.GetProductByIdAsync(productId)).ReturnsAsync(product);

            var result = await _service.AddWishListItemToCartAsync(userId, wishId);

            Assert.Equal("Out of stock!", result);
            _wishListRepoMock.Verify(r => r.DeleteWishListItemAsync(It.IsAny<WishListItem>()), Times.Never);
        }

        [Fact(DisplayName = "AddWishListItemToCartAsync - New item - Adds to cart + deletes wishlist")]
        public async Task AddToCart_AddsNewItem()
        {
            var userId = "U001";
            var wishId = "WLI-U001-P002";
            var productId = "P002";
            var cart = new Cart { Id = "C001", CartItems = new List<CartItem>() };
            var product = new Product { Id = productId, Price = 150m, Stock = 20 };
            var wishItem = new WishListItem { Id = wishId, ProductID = productId };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishId)).ReturnsAsync(wishItem);
            _cartRepoMock.Setup(r => r.GetCartByUserIdAsync(userId)).ReturnsAsync(cart);
            _productRepoMock.Setup(r => r.GetProductByIdAsync(productId)).ReturnsAsync(product);
            _cartItemRepoMock.Setup(r => r.AddCartItemAsync(It.IsAny<CartItem>())).ReturnsAsync("Added to cart!");
            _wishListRepoMock.Setup(r => r.DeleteWishListItemAsync(wishItem)).ReturnsAsync("Deleted!");

            var result = await _service.AddWishListItemToCartAsync(userId, wishId);

            Assert.Equal("Deleted!", result);
            _cartItemRepoMock.Verify(r => r.AddCartItemAsync(It.Is<CartItem>(ci =>
                ci.CartId == cart.Id &&
                ci.ProductId == productId &&
                ci.Quantity == 1 &&
                ci.PriceAtAdd == 150m
            )), Times.Once);
        }

        [Theory(DisplayName = "AddWishListItemToCartAsync - userId null/empty - Returns null")]
        [InlineData(null)]
        [InlineData("")]
        public async Task AddToCart_NullOrEmptyUserId_ReturnsNull(string userId)
        {
            var result = await _service.AddWishListItemToCartAsync(userId, "WLI-xxx");
            Assert.Null(result);
        }

        [Theory(DisplayName = "AddWishListItemToCartAsync - wishListItemId null/empty - Returns null")]
        [InlineData(null)]
        [InlineData("")]
        public async Task AddToCart_NullOrEmptyWishId_ReturnsNull(string wishId)
        {
            var result = await _service.AddWishListItemToCartAsync("U001", wishId);
            Assert.Null(result);
        }

        [Fact(DisplayName = "AddWishListItemToCartAsync - Wishlist item not found - Returns null")]
        public async Task AddToCart_WishItemNotFound_ReturnsNull()
        {
            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync("INVALID")).ReturnsAsync((WishListItem?)null);
            var result = await _service.AddWishListItemToCartAsync("U001", "INVALID");
            Assert.Null(result);
        }

        [Fact(DisplayName = "AddWishListItemToCartAsync - Cart not found - Returns null")]
        public async Task AddToCart_CartNotFound_ReturnsNull()
        {
            var wishItem = new WishListItem { ProductID = "P001" };
            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync("WLI")).ReturnsAsync(wishItem);
            _cartRepoMock.Setup(r => r.GetCartByUserIdAsync("U001")).ReturnsAsync((Cart?)null);

            var result = await _service.AddWishListItemToCartAsync("U001", "WLI");
            Assert.Null(result);
        }

        [Fact(DisplayName = "AddWishListItemToCartAsync - Product not found - Returns null")]
        public async Task AddToCart_ProductNotFound_ReturnsNull()
        {
            var wishItem = new WishListItem { ProductID = "P999" };
            var cart = new Cart { Id = "C001", CartItems = new List<CartItem>() };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync("WLI")).ReturnsAsync(wishItem);
            _cartRepoMock.Setup(r => r.GetCartByUserIdAsync("U001")).ReturnsAsync(cart);
            _productRepoMock.Setup(r => r.GetProductByIdAsync("P999")).ReturnsAsync((Product?)null);

            var result = await _service.AddWishListItemToCartAsync("U001", "WLI");
            Assert.Null(result);
        }

        // ===============================
        // GetAllWishListItemByUserIdAsync
        // ===============================

        [Fact(DisplayName = "GetAllWishListItemByUserIdAsync - Returns paged items with first image")]
        public async Task GetAllWishListItems_Paged_WithImage()
        {
            var userId = "U001";
            var items = new List<WishListItem>
            {
                new WishListItem { ProductID = "P1" }
            };
            var dtoItems = new List<ResponseDTOWishListItem>
            {
                new ResponseDTOWishListItem
                {
                    Product = new ResponseDTOProduct { Id = "P1" }
                }
            };

            _wishListRepoMock.Setup(r => r.GetAllWishListItemByUserIdAsync(userId))
                .ReturnsAsync(items);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOWishListItem>>(items))
                .Returns(dtoItems);
            _productImagesRepoMock.Setup(r => r.GetImagesByProductIdAsync("P1"))
                .ReturnsAsync(new List<ProductImage> { new ProductImage { URL = "img.jpg" } });

            var result = await _service.GetAllWishListItemByUserIdAsync(userId, 1, 10);

            Assert.Single(result.Items);
            Assert.Equal("img.jpg", result.Items.First().Product.ImageUrl);
            Assert.Equal(1, result.TotalCount);
        }

        [Theory(DisplayName = "GetAllWishListItemByUserIdAsync - userId null/empty - Returns empty result")]
        [InlineData(null)]
        [InlineData("")]
        public async Task GetAllWishListItems_NullUserId_ReturnsEmpty(string userId)
        {
            var result = await _service.GetAllWishListItemByUserIdAsync(userId, 1, 10);
            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalCount);
        }

        [Fact(DisplayName = "GetAllWishListItemByUserIdAsync - No items - Returns empty paged result")]
        public async Task GetAllWishListItems_NoItems_ReturnsEmpty()
        {
            var userId = "U002";
            _wishListRepoMock.Setup(r => r.GetAllWishListItemByUserIdAsync(userId))
                .ReturnsAsync(new List<WishListItem>());

            var result = await _service.GetAllWishListItemByUserIdAsync(userId, 1, 10);

            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalCount);
        }
    }
}