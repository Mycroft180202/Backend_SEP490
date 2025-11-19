using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Moq;

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

        private readonly WishListItemServiceImpl _service;

        public WishListItemUnitTests()
        {
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _wishListRepoMock = new Mock<IWishListItemRepositories>();
            _cartRepoMock = new Mock<ICartRepositories>();
            _productRepoMock = new Mock<IProductRepositories>();
            _cartItemRepoMock = new Mock<ICartItemRepositories>();

            _unitOfWorkMock.Setup(u => u.WishListItem).Returns(_wishListRepoMock.Object);
            _unitOfWorkMock.Setup(u => u.Cart).Returns(_cartRepoMock.Object);
            _unitOfWorkMock.Setup(u => u.Products).Returns(_productRepoMock.Object);
            _unitOfWorkMock.Setup(u => u.CartItem).Returns(_cartItemRepoMock.Object);

            _service = new WishListItemServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object);
        }

        // -------------------------------
        // CreateWishListItemAsync Tests
        // -------------------------------
        [Fact(DisplayName = "CreateWishListItemAsync - Normal Case - Creates successfully")]
        public async Task CreateWishListItemAsync_ReturnsSuccess()
        {
            var userId = "U001";
            var productId = "P001";

            _wishListRepoMock.Setup(r => r.CreateWishListItemAsync(It.IsAny<WishListItem>()))
                .ReturnsAsync("Create wishlist item successfully!");

            var result = await _service.CreateWishListItemAsync(userId, productId);

            Assert.Equal("Create wishlist item successfully!", result);

            _wishListRepoMock.Verify(r => r.CreateWishListItemAsync(It.Is<WishListItem>(
                w => w.UserID == userId &&
                     w.ProductID == productId &&
                     w.Id == $"WLI-{userId}-{productId}"
            )), Times.Once);
        }
        // Case 1: userId is null
        [Fact(DisplayName = "CreateWishListItemAsync - Null userId - Throws ArgumentNullException")]
        public async Task CreateWishListItemAsync_Throws_WhenUserIdIsNull()
        {
            string? userId = null;
            string productId = "P001";

            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateWishListItemAsync(userId!, productId));
        }

        // Case 2: productId is null
        [Fact(DisplayName = "CreateWishListItemAsync - Null productId - Throws ArgumentNullException")]
        public async Task CreateWishListItemAsync_Throws_WhenProductIdIsNull()
        {
            string userId = "U001";
            string? productId = null;

            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateWishListItemAsync(userId, productId!));
        }

        // Case 3: userId or productId is empty
        [Fact(DisplayName = "CreateWishListItemAsync - Empty userId or productId - Throws ArgumentException")]
        public async Task CreateWishListItemAsync_Throws_WhenUserIdOrProductIdEmpty()
        {
            // Empty userId
            await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateWishListItemAsync("", "P001"));

            // Empty productId
            await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateWishListItemAsync("U001", ""));
        }

        // -------------------------------
        // DeleteWishListItemAsync Tests
        // -------------------------------

        [Fact(DisplayName = "DeleteWishListItemAsync - Normal Case - Deletes successfully")]
        public async Task DeleteWishListItemAsync_ReturnsSuccess()
        {
            var wishListItemId = "WLI-U001-P001";
            var wishListItem = new WishListItem { Id = wishListItemId };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishListItemId))
                .ReturnsAsync(wishListItem);
            _wishListRepoMock.Setup(r => r.DeleteWishListItemAsync(wishListItem))
                .ReturnsAsync("Delete wishlist item successfully!");

            var result = await _service.DeleteWishListItemAsync(wishListItemId);

            Assert.Equal("Delete wishlist item successfully!", result);
            _wishListRepoMock.Verify(r => r.DeleteWishListItemAsync(wishListItem), Times.Once);
        }

        // CASE 2: Null or empty param
        [Theory(DisplayName = "DeleteWishListItemAsync - Invalid input (null or empty) - Throws ArgumentNullException")]
        [InlineData(null)]
        [InlineData("")]
        public async Task DeleteWishListItemAsync_InvalidId_ThrowsException(string invalidId)
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.DeleteWishListItemAsync(invalidId));
            _wishListRepoMock.Verify(r => r.GetWishListItemByIdAsync(It.IsAny<string>()), Times.Never);
        }


        //  CASE 3: Item not found
        [Fact(DisplayName = "DeleteWishListItemAsync - Item not found - Returns not found message")]
        public async Task DeleteWishListItemAsync_ItemNotFound_ReturnsMessage()
        {
            var wishListItemId = "WLI-U999-P999";

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishListItemId))
                .ReturnsAsync((WishListItem?)null);

            var result = await _service.DeleteWishListItemAsync(wishListItemId);

            Assert.Equal("Wishlist item not found.", result);
            _wishListRepoMock.Verify(r => r.DeleteWishListItemAsync(It.IsAny<WishListItem>()), Times.Never);
        }

        // -------------------------------
        // AddWishListItemToCartAsync Tests
        // -------------------------------
        [Fact(DisplayName = "AddWishListItemToCartAsync - Item already in cart but in stock - Updates quantity")]
        public async Task AddWishListItemToCartAsync_UpdateQuantity_WhenItemExists()
        {
            var userId = "U001";
            var wishListItemId = "WLI-U001-P001";
            var productId = "P001";

            var product = new Product { Id = productId, Stock = 10, Price = 100 };
            var wishListItem = new WishListItem { Id = wishListItemId, ProductID = productId };
            var cart = new Cart
            {
                Id = "C001",
                CartItems = new List<CartItem>
                {
                    new CartItem { ProductId = productId, Quantity = 1 }
                }
            };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishListItemId))
                .ReturnsAsync(wishListItem);
            _cartRepoMock.Setup(r => r.GetAllCartItemsAsync(userId))
                .ReturnsAsync(cart);
            _productRepoMock.Setup(r => r.GetProductByIdAsync(productId))
                .ReturnsAsync(product);
            _cartItemRepoMock.Setup(r => r.UpdateCartItemAsync(It.IsAny<CartItem>(), 2))
                .ReturnsAsync("Updated successfully!");

            var result = await _service.AddWishListItemToCartAsync(userId, wishListItemId);

            Assert.Equal("Updated successfully!", result);
            _cartItemRepoMock.Verify(r => r.UpdateCartItemAsync(It.IsAny<CartItem>(), 2), Times.Once);
        }

        [Fact(DisplayName = "AddWishListItemToCartAsync - Out of stock - Returns message")]
        public async Task AddWishListItemToCartAsync_ReturnsOutOfStock_WhenOverStock()
        {
            var userId = "U001";
            var wishListItemId = "WLI-U001-P001";
            var productId = "P001";

            var product = new Product { Id = productId, Stock = 1 };
            var wishListItem = new WishListItem { Id = wishListItemId, ProductID = productId };
            var cart = new Cart
            {
                Id = "C001",
                CartItems = new List<CartItem>
                {
                    new CartItem { ProductId = productId, Quantity = 1 }
                }
            };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishListItemId))
                .ReturnsAsync(wishListItem);
            _cartRepoMock.Setup(r => r.GetAllCartItemsAsync(userId))
                .ReturnsAsync(cart);
            _productRepoMock.Setup(r => r.GetProductByIdAsync(productId))
                .ReturnsAsync(product);

            var result = await _service.AddWishListItemToCartAsync(userId, wishListItemId);

            Assert.Equal("Out of stock!", result);
        }

        [Fact(DisplayName = "AddWishListItemToCartAsync - Item not in cart - Adds new cart item and removes wishlist item")]
        public async Task AddWishListItemToCartAsync_AddsNewCartItem_WhenNotExist()
        {
            var userId = "U001";
            var wishListItemId = "WLI-U001-P002";
            var productId = "P002";

            var product = new Product { Id = productId, Stock = 10, Price = 200 };
            var wishListItem = new WishListItem { Id = wishListItemId, ProductID = productId };
            var cart = new Cart { Id = "C001", CartItems = new List<CartItem>() };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishListItemId))
                .ReturnsAsync(wishListItem);
            _cartRepoMock.Setup(r => r.GetAllCartItemsAsync(userId))
                .ReturnsAsync(cart);
            _productRepoMock.Setup(r => r.GetProductByIdAsync(productId))
                .ReturnsAsync(product);
            _cartItemRepoMock.Setup(r => r.AddCartItemAsync(It.IsAny<CartItem>()))
                .ReturnsAsync("Added!");
            _wishListRepoMock.Setup(r => r.DeleteWishListItemAsync(It.IsAny<WishListItem>()))
                .ReturnsAsync("Removed!");

            var result = await _service.AddWishListItemToCartAsync(userId, wishListItemId);

            Assert.Equal("Removed!", result);
            _cartItemRepoMock.Verify(r => r.AddCartItemAsync(It.Is<CartItem>(
                ci => ci.ProductId == productId &&
                      ci.Quantity == 1 &&
                      ci.PriceAtAdd == 200
            )), Times.Once);
        }

        // CASE : userId null or empty -> return invalid input message
        [Theory(DisplayName = "AddWishListItemToCartAsync - Invalid input userId - Returns invalid message")]
        [InlineData(null)]
        [InlineData("")]
        public async Task AddWishListItemToCartAsync_InvalidUserId_ReturnsInvalid(string invalidUserId)
        {
            var wishListItemId = "WLI-U001-P001";

            var result = await _service.AddWishListItemToCartAsync(invalidUserId!, wishListItemId);

            Assert.Equal("Invalid input.", result);
            _wishListRepoMock.Verify(r => r.GetWishListItemByIdAsync(It.IsAny<string>()), Times.Never);
        }

        // CASE : wishListItemId null or empty -> return invalid input message
        [Theory(DisplayName = "AddWishListItemToCartAsync - Invalid input wishListItemId - Returns invalid message")]
        [InlineData(null)]
        [InlineData("")]
        public async Task AddWishListItemToCartAsync_InvalidWishListItemId_ReturnsInvalid(string invalidWishListItemId)
        {
            var userId = "U001";

            var result = await _service.AddWishListItemToCartAsync(userId, invalidWishListItemId!);

            Assert.Equal("Invalid input.", result);
            _wishListRepoMock.Verify(r => r.GetWishListItemByIdAsync(It.IsAny<string>()), Times.Never);
        }

        // CASE : wishlist item not found -> return not found message
        [Fact(DisplayName = "AddWishListItemToCartAsync - Wishlist item not found - Returns not found")]
        public async Task AddWishListItemToCartAsync_WishlistItemNotFound_ReturnsNotFound()
        {
            var userId = "U001";
            var wishListItemId = "WLI-U999-P999";

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishListItemId))
                .ReturnsAsync((WishListItem?)null);

            var result = await _service.AddWishListItemToCartAsync(userId, wishListItemId);

            Assert.Equal("Wishlist item not found.", result);
            _cartRepoMock.Verify(r => r.GetAllCartItemsAsync(It.IsAny<string>()), Times.Never);
        }

        // CASE : product not found -> return product not found message
        [Fact(DisplayName = "AddWishListItemToCartAsync - Product not found - Returns message")]
        public async Task AddWishListItemToCartAsync_ProductNotFound_ReturnsMessage()
        {
            var userId = "U001";
            var wishListItemId = "WLI-U001-P999";
            var productId = "P999";

            var wishListItem = new WishListItem { Id = wishListItemId, ProductID = productId };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishListItemId))
                .ReturnsAsync(wishListItem);
            _cartRepoMock.Setup(r => r.GetAllCartItemsAsync(userId))
                .ReturnsAsync(new Cart { Id = "C001", CartItems = new List<CartItem>() });
            _productRepoMock.Setup(r => r.GetProductByIdAsync(productId))
                .ReturnsAsync((Product?)null);

            var result = await _service.AddWishListItemToCartAsync(userId, wishListItemId);

            Assert.Equal("Product not found.", result);
        }

        // CASE : cart not found (GetAllCartItemsAsync trả về null) -> return cart not found message
        [Fact(DisplayName = "AddWishListItemToCartAsync - Cart not found - Returns message")]
        public async Task AddWishListItemToCartAsync_CartNotFound_ReturnsMessage()
        {
            var userId = "U001";
            var wishListItemId = "WLI-U001-P001";
            var productId = "P001";

            var wishListItem = new WishListItem { Id = wishListItemId, ProductID = productId };

            _wishListRepoMock.Setup(r => r.GetWishListItemByIdAsync(wishListItemId))
                .ReturnsAsync(wishListItem);
            _cartRepoMock.Setup(r => r.GetAllCartItemsAsync(userId))
                .ReturnsAsync((Cart?)null); 
            _productRepoMock.Setup(r => r.GetProductByIdAsync(productId))
                .ReturnsAsync(new Product { Id = productId, Stock = 10, Price = 100 });

            var result = await _service.AddWishListItemToCartAsync(userId, wishListItemId);

            Assert.Equal("Cart not found.", result);
        }

        // -------------------------------
        // GetAllWishListItemByUserIdAsync Tests
        // -------------------------------

        [Fact(DisplayName = "GetAllWishListItemByUserIdAsync - Normal Case - Returns paged result")]
        public async Task GetAllWishListItemByUserIdAsync_ReturnsPagedResult()
        {
            var userId = "U001";
            var wishList = new List<WishListItem>
            {
                new WishListItem { Id = "W1", UserID = userId, ProductID = "P1" }
            };

            _wishListRepoMock.Setup(r => r.GetAllWishListItemByUserIdAsync(userId, 1, 10))
                .ReturnsAsync(wishList);
            _wishListRepoMock.Setup(r => r.GetAllWishListItemByUserIdAsync(userId))
                .ReturnsAsync(wishList);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOWishListItem>>(It.IsAny<IEnumerable<WishListItem>>()))
                .Returns(new List<ResponseDTOWishListItem>
                {
            new ResponseDTOWishListItem { UserID = userId, ProductID = "P1" }
                });

            var result = await _service.GetAllWishListItemByUserIdAsync(userId, 1, 10);

            Assert.Single(result.Items);
            Assert.Equal(1, result.TotalCount);
            Assert.Equal(1, result.PageIndex);
            Assert.Equal(10, result.PageSize);
        }

        // CASE 2: userId null hoặc rỗng
        [Theory(DisplayName = "GetAllWishListItemByUserIdAsync - Invalid userId (null or empty) - Returns empty result")]
        [InlineData(null)]
        [InlineData("")]
        public async Task GetAllWishListItemByUserIdAsync_InvalidUserId_ReturnsEmpty(string invalidUserId)
        {
            var result = await _service.GetAllWishListItemByUserIdAsync(invalidUserId, 1, 10);

            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalCount);
            _wishListRepoMock.Verify(r => r.GetAllWishListItemByUserIdAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        // CASE 3: Không có item nào trong wishlist
        [Fact(DisplayName = "GetAllWishListItemByUserIdAsync - No items found - Returns empty list")]
        public async Task GetAllWishListItemByUserIdAsync_NoItemsFound_ReturnsEmptyList()
        {
            var userId = "U002";
            var emptyList = new List<WishListItem>();

            _wishListRepoMock.Setup(r => r.GetAllWishListItemByUserIdAsync(userId, 1, 10))
                .ReturnsAsync(emptyList);
            _wishListRepoMock.Setup(r => r.GetAllWishListItemByUserIdAsync(userId))
                .ReturnsAsync(emptyList);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOWishListItem>>(It.IsAny<IEnumerable<WishListItem>>()))
                .Returns(new List<ResponseDTOWishListItem>());

            var result = await _service.GetAllWishListItemByUserIdAsync(userId, 1, 10);

            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalCount);
            Assert.Equal(1, result.PageIndex);
            Assert.Equal(10, result.PageSize);
        }

    }
}