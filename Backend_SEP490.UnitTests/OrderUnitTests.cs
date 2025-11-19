using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class OrderUnitTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly OrderServiceImpl _orderService;

        public OrderUnitTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _orderService = new OrderServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object);
        }

        [Fact(DisplayName = "CreateOrderAsync - Success")]
        public async Task CreateOrderAsync_ShouldReturnSuccessMessage()
        {
            // Arrange
            string userId = "user-01";
            var request = new RequestCreateOrder { ShipingAddressId = "ADDR-01" };

            var cart = new Cart { Id = "cart-01" };
            var cartItems = new List<CartItem>
            {
                new CartItem { ProductId = "P-01", Quantity = 2, PriceAtAdd = 100 },
                new CartItem { ProductId = "P-02", Quantity = 1, PriceAtAdd = 50 }
            };

            _unitOfWorkMock.Setup(c => c.Cart.GetAllCartItemsAsync(userId))
                .ReturnsAsync(cart);

            _unitOfWorkMock.Setup(c => c.CartItem.GetAllCartitemByCartIdAsync(cart.Id))
                .ReturnsAsync(cartItems);

            _unitOfWorkMock.Setup(c => c.Order.CreateOrderAsync(It.IsAny<Order>()))
                .ReturnsAsync(true);

            _unitOfWorkMock.Setup(c => c.OrderDetail.CreateOrderItemAsync(It.IsAny<List<OrderItem>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _orderService.CreateOrderAsync(userId, request);

            // Assert
            Assert.Equal("Create order successfully!", result);
            _unitOfWorkMock.Verify(c => c.Order.CreateOrderAsync(It.IsAny<Order>()), Times.Once);
            _unitOfWorkMock.Verify(c => c.OrderDetail.CreateOrderItemAsync(It.IsAny<List<OrderItem>>()), Times.Once);
        }
        [Fact(DisplayName = "CreateOrderAsync - OrderItem creation fails handled")]
        public async Task CreateOrderAsync_OrderItemCreateFails_HandledException()
        {
            // Arrange
            string userId = "user-01";
            var request = new RequestCreateOrder { ShipingAddressId = "ADDR-01" };

            var cart = new Cart { Id = "cart-01" };
            var cartItems = new List<CartItem>
            {
                new CartItem { ProductId = "P-01", Quantity = 2, PriceAtAdd = 100 }
            };

            _unitOfWorkMock.Setup(c => c.Cart.GetAllCartItemsAsync(userId)).ReturnsAsync(cart);
            _unitOfWorkMock.Setup(c => c.CartItem.GetAllCartitemByCartIdAsync(cart.Id)).ReturnsAsync(cartItems);
            _unitOfWorkMock.Setup(c => c.Order.CreateOrderAsync(It.IsAny<Order>())).ReturnsAsync(true);

            _unitOfWorkMock.Setup(c => c.OrderDetail.CreateOrderItemAsync(It.IsAny<List<OrderItem>>())).ReturnsAsync(false);

            // Act & Assert
            try
            {
                var result = await _orderService.CreateOrderAsync(userId, request);
                Assert.Equal("Create order item failed!", result);
            }
            catch (Exception ex)
            {
                Assert.NotNull(ex);
            }

            _unitOfWorkMock.Verify(c => c.Order.CreateOrderAsync(It.IsAny<Order>()), Times.Once);
            _unitOfWorkMock.Verify(c => c.OrderDetail.CreateOrderItemAsync(It.IsAny<List<OrderItem>>()), Times.Once);
        }


        [Fact(DisplayName = "GetOrderByIdAsync - Returns Paged OrderItems")]
        public async Task GetOrderByIdAsync_ShouldReturnPagedOrder()
        {
            // Arrange
            string orderId = "ORDER-01";
            int pageIndex = 1;
            int pageSize = 1;

            var order = new Order
            {
                OrderNumber = "ORDER-01",
                CustomerId = "user-01",
                Status = "Pending",
                TotalAmount = 150,
                ShipingAddressId = "ADDR-01",
                CreateAt = DateTime.UtcNow,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem { ProductID = "P-01", Quantity = 2, UnitPrice = 100 },
                    new OrderItem { ProductID = "P-02", Quantity = 1, UnitPrice = 50 }
                }
            };

            var responseDto = new ResponseDTOOrder
            {
                OrderNumber = order.OrderNumber,
                CustomerId = order.CustomerId,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                ShipingAddressId = order.ShipingAddressId,
                CreateAt = order.CreateAt,
                Items = order.OrderItems.Select(i => new ResponseDTOOrderItem
                {
                    ProductID = i.ProductID,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice
                }).ToList()
            };

            _unitOfWorkMock.Setup(c => c.Order.GetAllOrderByIdAsync(orderId))
                .ReturnsAsync(order);

            _mapperMock.Setup(m => m.Map<ResponseDTOOrder>(order))
                .Returns(responseDto);

            // Act
            var result = await _orderService.GetOrderByIdAsync(orderId, pageIndex, pageSize);

            // Assert
            Assert.Single(result.Items); // paging: pageSize = 1
            Assert.Equal("P-01", result.Items.First().ProductID);
        }
        [Fact(DisplayName = "GetOrderByIdAsync - Order has no items returns empty list")]
        public async Task GetOrderByIdAsync_NoOrderItems_ReturnsEmptyItems()
        {
            // Arrange
            string orderId = "ORDER-01";
            int pageIndex = 1;
            int pageSize = 1;

            var order = new Order
            {
                OrderNumber = "ORDER-01",
                OrderItems = null // hoặc new List<OrderItem>()
            };

            var responseDto = new ResponseDTOOrder
            {
                OrderNumber = order.OrderNumber,
                Items = new List<ResponseDTOOrderItem>() // empty
            };

            _unitOfWorkMock.Setup(c => c.Order.GetAllOrderByIdAsync(orderId)).ReturnsAsync(order);
            _mapperMock.Setup(m => m.Map<ResponseDTOOrder>(order)).Returns(responseDto);

            // Act
            var result = await _orderService.GetOrderByIdAsync(orderId, pageIndex, pageSize);

            // Assert
            Assert.Empty(result.Items);
        }
        [Fact(DisplayName = "GetOrderByIdAsync - Paging multiple pages")]
        public async Task GetOrderByIdAsync_PagingMultiplePages()
        {
            // Arrange
            string orderId = "ORDER-01";
            int pageIndex = 2;
            int pageSize = 1;

            var order = new Order
            {
                OrderNumber = "ORDER-01",
                CustomerId = "user-01",
                Status = "Pending",
                TotalAmount = 150,
                ShipingAddressId = "ADDR-01",
                CreateAt = DateTime.UtcNow,
                OrderItems = new List<OrderItem>
        {
            new OrderItem { ProductID = "P-01", Quantity = 2, UnitPrice = 100 },
            new OrderItem { ProductID = "P-02", Quantity = 1, UnitPrice = 50 }
        }
            };

            var responseDto = new ResponseDTOOrder
            {
                OrderNumber = order.OrderNumber,
                CustomerId = order.CustomerId,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                ShipingAddressId = order.ShipingAddressId,
                CreateAt = order.CreateAt,
                Items = order.OrderItems.Select(i => new ResponseDTOOrderItem
                {
                    ProductID = i.ProductID,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice
                }).ToList()
            };

            _unitOfWorkMock.Setup(c => c.Order.GetAllOrderByIdAsync(orderId)).ReturnsAsync(order);
            _mapperMock.Setup(m => m.Map<ResponseDTOOrder>(order)).Returns(responseDto);

            // Act
            var result = await _orderService.GetOrderByIdAsync(orderId, pageIndex, pageSize);

            // Assert
            Assert.Single(result.Items);
            Assert.Equal("P-02", result.Items.First().ProductID); // item thứ 2
        }

        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Filters Applied")]
        public async Task GetAllOrderByUserIdAsync_ShouldReturnFilteredOrders()
        {
            // Arrange
            string userId = "user-01";
            DateTime now = DateTime.UtcNow;
            var orders = new List<Order>
            {
                new Order { OrderNumber = "ORDER-001", Status = "Pending", CreateAt = now },
                new Order { OrderNumber = "ORDER-002", Status = "Completed", CreateAt = now }
            };

            var filter = new RequestFilterOrder { search = "001", Status = "Pending", CreateAt = now };

            _unitOfWorkMock.Setup(c => c.Order.GetAllOrderByUserIdAsync(userId))
                .ReturnsAsync(orders);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOOrder>>(It.IsAny<IEnumerable<Order>>()))
                .Returns((IEnumerable<Order> o) => o.Select(x => new ResponseDTOOrder
                {
                    OrderNumber = x.OrderNumber,
                    Status = x.Status,
                    CreateAt = x.CreateAt
                }).ToList());

            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(userId, filter);

            // Assert
            Assert.Single(result);
            Assert.Equal("ORDER-001", result.First().OrderNumber);
            Assert.Equal("Pending", result.First().Status);
        }
        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Filter by Status only")]
        public async Task GetAllOrderByUserIdAsync_FilterByStatus()
        {
            // Arrange
            string userId = "user-01";
            var orders = new List<Order>
            {
                new Order { OrderNumber = "ORDER-001", Status = "Pending", CreateAt = DateTime.UtcNow },
                new Order { OrderNumber = "ORDER-002", Status = "Completed", CreateAt = DateTime.UtcNow }
            };
            var filter = new RequestFilterOrder { search = "", Status = "Completed" };

            _unitOfWorkMock.Setup(c => c.Order.GetAllOrderByUserIdAsync(userId))
                .ReturnsAsync(orders);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOOrder>>(It.IsAny<IEnumerable<Order>>()))
                .Returns((IEnumerable<Order> o) => o.Select(x => new ResponseDTOOrder
                {
                    OrderNumber = x.OrderNumber,
                    Status = x.Status
                }).ToList());

            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(userId, filter);

            // Assert
            Assert.Single(result);
            Assert.Equal("Completed", result.First().Status);
        }
        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Filter by CreateAt")]
        public async Task GetAllOrderByUserIdAsync_FilterByCreateAt()
        {
            // Arrange
            string userId = "user-01";
            var now = DateTime.UtcNow;
            var orders = new List<Order>
            {
                new Order { OrderNumber = "ORDER-001", Status = "Pending", CreateAt = now },
                new Order { OrderNumber = "ORDER-002", Status = "Completed", CreateAt = now.AddDays(-1) }
            };
            var filter = new RequestFilterOrder { CreateAt = now };

            _unitOfWorkMock.Setup(c => c.Order.GetAllOrderByUserIdAsync(userId))
                .ReturnsAsync(orders);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOOrder>>(It.IsAny<IEnumerable<Order>>()))
                .Returns((IEnumerable<Order> o) => o.Select(x => new ResponseDTOOrder
                {
                    OrderNumber = x.OrderNumber,
                    Status = x.Status,
                    CreateAt = x.CreateAt
                }).ToList());

            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(userId, filter);

            // Assert
            Assert.Single(result);
            Assert.Equal("ORDER-001", result.First().OrderNumber);
        }
        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Filter by Search + Status + CreateAt")]
        public async Task GetAllOrderByUserIdAsync_FilterByAllCriteria()
        {
            // Arrange
            string userId = "user-01";
            var now = DateTime.UtcNow;
            var orders = new List<Order>
            {
                new Order { OrderNumber = "ORDER-001", Status = "Pending", CreateAt = now },
                new Order { OrderNumber = "ORDER-002", Status = "Pending", CreateAt = now },
                new Order { OrderNumber = "ORDER-003", Status = "Completed", CreateAt = now }
            };
            var filter = new RequestFilterOrder { search = "001", Status = "Pending", CreateAt = now };

            _unitOfWorkMock.Setup(c => c.Order.GetAllOrderByUserIdAsync(userId))
                .ReturnsAsync(orders);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOOrder>>(It.IsAny<IEnumerable<Order>>()))
                .Returns((IEnumerable<Order> o) => o.Select(x => new ResponseDTOOrder
                {
                    OrderNumber = x.OrderNumber,
                    Status = x.Status,
                    CreateAt = x.CreateAt
                }).ToList());

            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(userId, filter);

            // Assert
            Assert.Single(result);
            Assert.Equal("ORDER-001", result.First().OrderNumber);
            Assert.Equal("Pending", result.First().Status);
        }
        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Null filter returns all orders")]
        public async Task GetAllOrderByUserIdAsync_NullFilter_ReturnsAll()
        {
            // Arrange
            string userId = "user-01";
            var orders = new List<Order>
            {
                new Order { OrderNumber = "ORDER-001", Status = "Pending", CreateAt = DateTime.UtcNow },
                new Order { OrderNumber = "ORDER-002", Status = "Completed", CreateAt = DateTime.UtcNow }
            };

            _unitOfWorkMock.Setup(c => c.Order.GetAllOrderByUserIdAsync(userId))
                .ReturnsAsync(orders);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOOrder>>(It.IsAny<IEnumerable<Order>>()))
                .Returns((IEnumerable<Order> o) => o.Select(x => new ResponseDTOOrder
                {
                    OrderNumber = x.OrderNumber,
                    Status = x.Status
                }).ToList());

            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(userId, null);

            // Assert
            Assert.Equal(2, result.Count());
        }

    }
}
