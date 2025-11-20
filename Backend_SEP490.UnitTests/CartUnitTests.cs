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

            _unitOfWorkMock.Setup(u => u.Cart).Returns(Mock.Of<ICartRepositories>());
            _unitOfWorkMock.Setup(u => u.CartItem).Returns(Mock.Of<ICartItemRepositories>());
            _unitOfWorkMock.Setup(u => u.Products).Returns(Mock.Of<IProductRepositories>());
            _unitOfWorkMock.Setup(u => u.ProductImages).Returns(Mock.Of<IProductImagesRepositories>());

            _cartService = new CartServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object);
        }

        // ========================== GET CART ==========================

        //[Fact(DisplayName = "GetCartByUserIdAsync - Returns mapped cart with items + pagination + image URL")]
        //public async Task GetCartByUserIdAsync_ReturnsCartWithItems()
        //{
        //    string userId = "user-01";

        //    var cart = new Cart
        //    {
        //        Id = "Cart-user-01-0000",
        //        CartItems = new List<CartItem>
        //        {
        //            new CartItem
        //            {
        //                Id = "CI-01",
        //                ProductId = "P-01",
        //                Quantity = 2,
        //                PriceAtAdd = 100,
        //                Product = new Product
        //                {
        //                    Id = "P-01",
        //                    Name = "Product 1",
        //                    Price = 100,
        //                    Category = "Cat 1",
        //                    ArtisanId = "A1",
        //                    Stock = 10
        //                }
        //            }
        //        },
        //        CustomerID = userId,
        //        Customer = new User
        //        {
        //            UserID = userId,
        //            Username = "user1",
        //            Email = "user1@example.com"
        //        }
        //    };

        //    var productImages = new List<ProductImages>
        //    {
        //        new ProductImages { URL = "image-01.png" }
        //    };

        //    _unitOfWorkMock.Setup(x => x.Cart.GetCartByUserIdAsync(userId))
        //        .ReturnsAsync(cart);

        //    _unitOfWorkMock.Setup(x => x.ProductImages.GetImagesByProductIdAsync("P-01"))
        //        .ReturnsAsync(productImages);

        //    var mappedItems = new List<ResponseDTOCartItem>
        //    {
        //        new ResponseDTOCartItem
        //        {
        //            Quantity = 2,
        //            PriceAtAdd = 100,
        //            Product = new RequestDTOProduct
        //            {
        //                Id = "P-01",
        //                Name = "Product 1",
        //                Price = 100,
        //                Category = "Cat 1",
        //                ArtisanId = "A1",
        //                Stock = 10
        //            }
        //        }
        //    };

        //    var mappedCart = new ResponseDTOCart
        //    {
        //        CreateAt = cart.CreateAt,
        //    };

        //    _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOCartItem>>(It.IsAny<IEnumerable<CartItem>>()))
        //        .Returns(mappedItems);

        //    _mapperMock.Setup(m => m.Map<ResponseDTOCart>(cart))
        //        .Returns(mappedCart);

        //    var result = await _cartService.GetCartByUserIdAsync(userId, 1, 10);

        //    Assert.NotNull(result);
        //    Assert.NotNull(result.CartItems);
        //    Assert.Single(result.CartItems.Items);
        //    Assert.Equal("Product 1", result.CartItems.Items.First().Product.Name);
        //    Assert.Equal("image-01.png", result.CartItems.Items.First().Product.ImageUrl);
        //}

        [Fact(DisplayName = "GetCartByUserIdAsync - Creates new cart if not exists")]
        public async Task GetCartByUserIdAsync_NewCartCreated()
        {
            string userId = "user-01";

            _unitOfWorkMock.Setup(x => x.Cart.GetCartByUserIdAsync(userId))
                .ReturnsAsync((Cart)null);

            _unitOfWorkMock.Setup(x => x.Cart.AddCartAsync(It.IsAny<Cart>()))
                .ReturnsAsync(true);

            _unitOfWorkMock.Setup(x => x.Cart.GetCartByUserIdAsync(userId))
                .ReturnsAsync(new Cart
                {
                    Id = "Cart-user-01",
                    CartItems = new List<CartItem>()
                });

            _mapperMock.Setup(m => m.Map<ResponseDTOCart>(It.IsAny<Cart>()))
                .Returns(new ResponseDTOCart());

            var result = await _cartService.GetCartByUserIdAsync(userId, 1, 10);

            Assert.NotNull(result);
        }

        // ========================== ADD ITEM ==========================

        [Fact(DisplayName = "AddCartItemAsync - Add new item successfully")]
        public async Task AddCartItemAsync_NewItem_ReturnsAdded()
        {
            string userId = "user-01";

            var cart = new Cart
            {
                Id = "Cart-user-01",
                CartItems = new List<CartItem>()
            };

            var product = new Product { Id = "P-01", Stock = 10 };
            var req = new RequestAddCartItem { ProductId = "P-01", PriceAtAdd = 100, quantity = 1 };

            _unitOfWorkMock.Setup(x => x.Cart.GetCartByUserIdAsync(userId)).ReturnsAsync(cart);
            _unitOfWorkMock.Setup(x => x.Products.GetProductByIdAsync("P-01")).ReturnsAsync(product);

            _unitOfWorkMock.Setup(x => x.CartItem.AddCartItemAsync(It.IsAny<CartItem>()))
                .ReturnsAsync("Added");

            var result = await _cartService.AddCartItemAsync(userId, req);

            Assert.Equal("Added", result);
        }

        [Fact(DisplayName = "AddCartItemAsync - Increment existing item quantity")]
        public async Task AddCartItemAsync_ExistingItem_ReturnsUpdated()
        {
            string userId = "user-01";

            var cart = new Cart
            {
                Id = "Cart-user-01",
                CartItems = new List<CartItem>
                {
                    new CartItem { ProductId = "P-01", Quantity = 1 }
                }
            };

            var product = new Product { Id = "P-01", Stock = 10 };
            var req = new RequestAddCartItem { ProductId = "P-01", quantity = 2 };

            _unitOfWorkMock.Setup(x => x.Cart.GetCartByUserIdAsync(userId)).ReturnsAsync(cart);
            _unitOfWorkMock.Setup(x => x.Products.GetProductByIdAsync("P-01")).ReturnsAsync(product);

            _unitOfWorkMock.Setup(x => x.CartItem.UpdateCartItemAsync(It.IsAny<CartItem>(), 3))
                .ReturnsAsync("Updated");

            var result = await _cartService.AddCartItemAsync(userId, req);

            Assert.Equal("Updated", result);
        }

        [Fact(DisplayName = "AddCartItemAsync - Out of stock")]
        public async Task AddCartItemAsync_OutOfStock()
        {
            string userId = "user-01";

            var cart = new Cart
            {
                Id = "Cart-user-01",
                CartItems = new List<CartItem>
                {
                    new CartItem { ProductId = "P-01", Quantity = 5 }
                }
            };

            var product = new Product { Id = "P-01", Stock = 5 };
            var req = new RequestAddCartItem { ProductId = "P-01", quantity = 1 };

            _unitOfWorkMock.Setup(x => x.Cart.GetCartByUserIdAsync(userId)).ReturnsAsync(cart);
            _unitOfWorkMock.Setup(x => x.Products.GetProductByIdAsync("P-01")).ReturnsAsync(product);

            var result = await _cartService.AddCartItemAsync(userId, req);

            Assert.Equal("Out of stock!", result);
        }

        // ========================== UPDATE ITEM ==========================

        [Fact(DisplayName = "UpdateCartItemAsync - Update quantity successfully")]
        public async Task UpdateCartItemAsync_Valid()
        {
            var cartItem = new CartItem { Id = "CI-01", ProductId = "P-01", Quantity = 1 };
            var product = new Product { Id = "P-01", Stock = 10 };

            _unitOfWorkMock.Setup(x => x.CartItem.GetCartItemByIdAsync("CI-01")).ReturnsAsync(cartItem);
            _unitOfWorkMock.Setup(x => x.Products.GetProductByIdAsync("P-01")).ReturnsAsync(product);

            _unitOfWorkMock.Setup(x => x.CartItem.UpdateCartItemAsync(cartItem, 5))
                .ReturnsAsync("Updated");

            var result = await _cartService.UpdateCartItemAsync("CI-01", 5);

            Assert.Equal("Updated", result);
        }

        [Fact(DisplayName = "UpdateCartItemAsync - Quantity exceeds stock")]
        public async Task UpdateCartItemAsync_ExceedsStock()
        {
            var cartItem = new CartItem { Id = "CI-01", ProductId = "P-01", Quantity = 1 };
            var product = new Product { Id = "P-01", Stock = 3 };

            _unitOfWorkMock.Setup(x => x.CartItem.GetCartItemByIdAsync("CI-01")).ReturnsAsync(cartItem);
            _unitOfWorkMock.Setup(x => x.Products.GetProductByIdAsync("P-01")).ReturnsAsync(product);

            var result = await _cartService.UpdateCartItemAsync("CI-01", 5);

            Assert.Equal("Out of stock!", result);
        }

        [Fact(DisplayName = "UpdateCartItemAsync - Delete when quantity = 0")]
        public async Task UpdateCartItemAsync_QuantityZero()
        {
            var cartItem = new CartItem { Id = "CI-01", ProductId = "P-01" };
            var product = new Product { Id = "P-01", Stock = 10 };

            _unitOfWorkMock.Setup(x => x.CartItem.GetCartItemByIdAsync("CI-01")).ReturnsAsync(cartItem);
            _unitOfWorkMock.Setup(x => x.Products.GetProductByIdAsync("P-01")).ReturnsAsync(product);
            _unitOfWorkMock.Setup(x => x.CartItem.DeleteCartItemAsync(cartItem)).ReturnsAsync("Deleted");

            var result = await _cartService.UpdateCartItemAsync("CI-01", 0);

            Assert.Equal("Deleted", result);
        }

        // ========================== DELETE ITEM ==========================

        [Fact(DisplayName = "DeleteCartItemAsync - Delete successfully")]
        public async Task DeleteCartItemAsync_Deletes()
        {
            var cartItem = new CartItem { Id = "CI-01" };

            _unitOfWorkMock.Setup(x => x.CartItem.GetCartItemByIdAsync("CI-01")).ReturnsAsync(cartItem);
            _unitOfWorkMock.Setup(x => x.CartItem.DeleteCartItemAsync(cartItem)).ReturnsAsync("Deleted");

            var result = await _cartService.DeleteCartItemAsync("CI-01");

            Assert.Equal("Deleted", result);
        }

        [Fact(DisplayName = "DeleteCartItemAsync - Not found")]
        public async Task DeleteCartItemAsync_NotFound()
        {
            _unitOfWorkMock.Setup(x => x.CartItem.GetCartItemByIdAsync("CI-01"))
                .ReturnsAsync((CartItem)null);

            var result = await _cartService.DeleteCartItemAsync("CI-01");

            Assert.Equal("CartItem not found!", result);
        }
    }
}
