using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class CartUnitTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly CartServiceImpl _cartService;

        public CartUnitTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _cartService = new CartServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object);
        }

        [Fact(DisplayName = "GetCartByUserIdAsync - Returns mapped cart with items")]
        public async Task GetCartByUserIdAsync_ReturnsCartWithItems()
        {
            // Arrange
            string userId = "user-01";

            var cart = new Cart
            {
                Id = "cart-01",
                CartItems = new List<CartItem>
                {
                    new CartItem
                    {
                        ProductId = "P-01",
                        Quantity = 2,
                        PriceAtAdd = 100,
                        Product = new Product
                        {
                            Name = "Product 1",
                            Price = 100,
                            Category = "Cat 1",
                            ArtisanId = "Artisan-01",
                            Stock = 10
                        }
                    }
                },
                Customer = new User
                {
                    UserID = "user-01",
                    Username = "user1",
                    Email = "user1@example.com"
                }
            };

            var responseDto = new ResponseDTOCart
            {
                CreateAt = cart.CreateAt,
                Customer = new ResponseDTOUser
                {
                    UserID = cart.Customer.UserID,
                    Username = cart.Customer.Username,
                    Email = cart.Customer.Email
                },
                CartItems = cart.CartItems.Select(ci => new ResponseDTOCartItem
                {
                    Quantity = ci.Quantity,
                    PriceAtAdd = ci.PriceAtAdd,
                    Product = new RequestDTOProduct
                    {
                        Name = ci.Product.Name,
                        Price = ci.Product.Price,
                        Category = ci.Product.Category,
                        ArtisanId = ci.Product.ArtisanId,
                        Stock = ci.Product.Stock
                    }
                }).ToList()
            };

            _unitOfWorkMock.Setup(c => c.Cart.GetAllCartItemsAsync(userId))
                .ReturnsAsync(cart);

            _mapperMock.Setup(m => m.Map<ResponseDTOCart>(cart))
                .Returns(responseDto);

            // Act
            var result = await _cartService.GetCartByUserIdAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.CartItems);
            Assert.Equal("Product 1", result.CartItems.First().Product.Name);
            Assert.Equal(2, result.CartItems.First().Quantity);
        }

        [Fact(DisplayName = "AddCartItemAsync - Add new item successfully")]
        public async Task AddCartItemAsync_NewItem_ReturnsAdded()
        {
            // Arrange
            string userId = "user-01";
            var cart = new Cart { Id = "cart-01", CartItems = new List<CartItem>() };
            var product = new Product { Id = "P-01", Stock = 10, Name = "Product 1" };
            var request = new RequestAddCartItem { ProductId = "P-01", PriceAtAdd = 100 };

            _unitOfWorkMock.Setup(c => c.Cart.GetAllCartItemsAsync(userId)).ReturnsAsync(cart);
            _unitOfWorkMock.Setup(c => c.Products.GetProductByIdAsync(request.ProductId)).ReturnsAsync(product);
            _unitOfWorkMock.Setup(c => c.CartItem.AddCartItemAsync(It.IsAny<CartItem>())).ReturnsAsync("Added");

            // Act
            var result = await _cartService.AddCartItemAsync(userId, request);

            // Assert
            Assert.Equal("Added", result);
        }

        [Fact(DisplayName = "AddCartItemAsync - Increment existing item quantity")]
        public async Task AddCartItemAsync_ExistingItem_ReturnsUpdated()
        {
            // Arrange
            string userId = "user-01";
            var cart = new Cart
            {
                Id = "cart-01",
                CartItems = new List<CartItem>
                {
                    new CartItem { ProductId = "P-01", Quantity = 1, PriceAtAdd = 100 }
                }
            };
            var product = new Product { Id = "P-01", Stock = 10 };
            var request = new RequestAddCartItem { ProductId = "P-01" };

            _unitOfWorkMock.Setup(c => c.Cart.GetAllCartItemsAsync(userId)).ReturnsAsync(cart);
            _unitOfWorkMock.Setup(c => c.Products.GetProductByIdAsync(request.ProductId)).ReturnsAsync(product);
            _unitOfWorkMock.Setup(c => c.CartItem.UpdateCartItemAsync(It.IsAny<CartItem>(), It.IsAny<int>())).ReturnsAsync("Updated");

            // Act
            var result = await _cartService.AddCartItemAsync(userId, request);

            // Assert
            Assert.Equal("Updated", result);
        }

        [Fact(DisplayName = "AddCartItemAsync - Out of stock")]
        public async Task AddCartItemAsync_ExistingItem_OutOfStock()
        {
            // Arrange
            string userId = "user-01";
            var cart = new Cart
            {
                Id = "cart-01",
                CartItems = new List<CartItem>
                {
                    new CartItem { ProductId = "P-01", Quantity = 5 }
                }
            };
            var product = new Product { Id = "P-01", Stock = 5 };
            var request = new RequestAddCartItem { ProductId = "P-01" };

            _unitOfWorkMock.Setup(c => c.Cart.GetAllCartItemsAsync(userId)).ReturnsAsync(cart);
            _unitOfWorkMock.Setup(c => c.Products.GetProductByIdAsync(request.ProductId)).ReturnsAsync(product);

            // Act
            var result = await _cartService.AddCartItemAsync(userId, request);

            // Assert
            Assert.Equal("Out of stock!", result);
        }

        [Fact(DisplayName = "UpdateCartItemAsync - Update quantity successfully")]
        public async Task UpdateCartItemAsync_ValidQuantity_ReturnsUpdated()
        {
            var cartItem = new CartItem { Id = "CI-01", ProductId = "P-01", Quantity = 1 };
            var product = new Product { Id = "P-01", Stock = 10 };

            _unitOfWorkMock.Setup(c => c.CartItem.GetCartItemByIdAsync(cartItem.Id)).ReturnsAsync(cartItem);
            _unitOfWorkMock.Setup(c => c.Products.GetProductByIdAsync(cartItem.ProductId)).ReturnsAsync(product);
            _unitOfWorkMock.Setup(c => c.CartItem.UpdateCartItemAsync(cartItem, 5)).ReturnsAsync("Updated");

            var result = await _cartService.UpdateCartItemAsync(cartItem.Id, 5);

            Assert.Equal("Updated", result);
        }

        [Fact(DisplayName = "UpdateCartItemAsync - Quantity exceeds stock")]
        public async Task UpdateCartItemAsync_QuantityExceedsStock_ReturnsOutOfStock()
        {
            var cartItem = new CartItem { Id = "CI-01", ProductId = "P-01", Quantity = 1 };
            var product = new Product { Id = "P-01", Stock = 3 };

            _unitOfWorkMock.Setup(c => c.CartItem.GetCartItemByIdAsync(cartItem.Id)).ReturnsAsync(cartItem);
            _unitOfWorkMock.Setup(c => c.Products.GetProductByIdAsync(cartItem.ProductId)).ReturnsAsync(product);

            var result = await _cartService.UpdateCartItemAsync(cartItem.Id, 5);

            Assert.Equal("Out of stock!", result);
        }

        [Fact(DisplayName = "UpdateCartItemAsync - Delete when quantity is 0")]
        public async Task UpdateCartItemAsync_QuantityZero_DeletesItem()
        {
            var cartItem = new CartItem { Id = "CI-01", ProductId = "P-01", Quantity = 2 };
            var product = new Product { Id = "P-01", Stock = 10 };

            _unitOfWorkMock.Setup(c => c.CartItem.GetCartItemByIdAsync(cartItem.Id)).ReturnsAsync(cartItem);
            _unitOfWorkMock.Setup(c => c.Products.GetProductByIdAsync(cartItem.ProductId)).ReturnsAsync(product);
            _unitOfWorkMock.Setup(c => c.CartItem.DeleteCartItemAsync(cartItem)).ReturnsAsync("Deleted");

            var result = await _cartService.UpdateCartItemAsync(cartItem.Id, 0);

            Assert.Equal("Deleted", result);
        }

        [Fact(DisplayName = "DeleteCartItemAsync - Delete successfully")]
        public async Task DeleteCartItemAsync_DeletesSuccessfully()
        {
            var cartItem = new CartItem { Id = "CI-01" };

            _unitOfWorkMock.Setup(c => c.CartItem.GetCartItemByIdAsync(cartItem.Id)).ReturnsAsync(cartItem);
            _unitOfWorkMock.Setup(c => c.CartItem.DeleteCartItemAsync(cartItem)).ReturnsAsync("Deleted");

            var result = await _cartService.DeleteCartItemAsync(cartItem.Id);

            Assert.Equal("Deleted", result);
        }

        [Fact(DisplayName = "DeleteCartItemAsync - CartItem not found")]
        public async Task DeleteCartItemAsync_CartItemNotFound_ReturnsNotFound()
        {
            _unitOfWorkMock.Setup(c => c.CartItem.GetCartItemByIdAsync("CI-01")).ReturnsAsync((CartItem)null);

            var result = await _cartService.DeleteCartItemAsync("CI-01");

            Assert.Equal("CartItem not found!", result);
        }
    }
}
