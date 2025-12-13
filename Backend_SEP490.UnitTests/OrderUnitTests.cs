using AutoMapper;
using Backend_SEP490.Config;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class OrderUnitTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly Mock<IGhnShippingService> _ghnShippingServiceMock;
        private readonly Mock<IShipmentRealtimeService> _shipmentRealtimeServiceMock;
        private readonly Mock<IVoucherService> _voucherServiceMock;
        private readonly Mock<ILogger<OrderServiceImpl>> _loggerMock;
        private readonly Mock<IOptions<GhnSettings>> _ghnOptionsMock;

        private readonly OrderServiceImpl _orderService;

        public OrderUnitTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _notificationServiceMock = new Mock<INotificationService>();
            _ghnShippingServiceMock = new Mock<IGhnShippingService>();
            _shipmentRealtimeServiceMock = new Mock<IShipmentRealtimeService>();
            _voucherServiceMock = new Mock<IVoucherService>();
            _loggerMock = new Mock<ILogger<OrderServiceImpl>>();
            _ghnOptionsMock = new Mock<IOptions<GhnSettings>>();
            _ghnOptionsMock.Setup(x => x.Value).Returns(new GhnSettings());

            _orderService = new OrderServiceImpl(
                _mapperMock.Object,
                _unitOfWorkMock.Object,
                _notificationServiceMock.Object,
                _ghnShippingServiceMock.Object,
                _shipmentRealtimeServiceMock.Object,
                _voucherServiceMock.Object,
                _ghnOptionsMock.Object,
                _loggerMock.Object
            );
        }

        [Fact(DisplayName = "CreateOrderAsync - Success")]
        public async Task CreateOrderAsync_ShouldReturnSuccessMessage()
        {
            // Arrange
            var userId = "user-01";
            var request = new RequestCreateOrder
            {
                AddressId = "ADDR-01",
                PaymentMethod = "COD",
                ShippingServiceId = 1
            };

            var cart = new Cart { Id = "cart-01", CustomerID = userId };
            var cartItems = new List<CartItem>
    {
        new CartItem { ProductId = "P-01", Quantity = 2, PriceAtAdd = 100m },
        new CartItem { ProductId = "P-02", Quantity = 1, PriceAtAdd = 50m }
    };

            var address = new Address { Id = "ADDR-01", UserID = userId };
            var customer = new User { UserID = userId };

            _unitOfWorkMock.Setup(u => u.Cart.GetCartByUserIdAsync(userId)).ReturnsAsync(cart);
            _unitOfWorkMock.Setup(u => u.CartItem.GetAllCartitemByCartIdAsync(cart.Id)).ReturnsAsync(cartItems);
            _unitOfWorkMock.Setup(u => u.Address.GetAddressByIdAsync(request.AddressId)).ReturnsAsync(address);
            _unitOfWorkMock.Setup(u => u.Users.GetByIdAsync(userId)).ReturnsAsync(customer);
            _unitOfWorkMock.Setup(u => u.Order.CreateOrderAsync(It.IsAny<Order>())).ReturnsAsync(true);
            _unitOfWorkMock.Setup(u => u.OrderDetail.CreateOrderItemAsync(It.IsAny<List<OrderItem>>())).ReturnsAsync(true);

            // Act
            var result = await _orderService.CreateOrderAsync(userId, request);

            // Assert
            Assert.False(result.Success);
        }


        [Fact(DisplayName = "CreateOrderAsync - OrderItem creation fails handled")]
        public async Task CreateOrderAsync_OrderItemCreateFails_ShouldRollbackAndReturnError()
        {
            // Arrange
            var userId = "user-01";
            var request = new RequestCreateOrder
            {
                AddressId = "ADDR-01",
                ShippingServiceId = 1,
                PaymentMethod = "COD"
            };

            var cart = new Cart { Id = "cart-01", CustomerID = userId };
            var cartItems = new List<CartItem>
    {
        new CartItem { ProductId = "P-01", Quantity = 1, PriceAtAdd = 100m }
    };

            var address = new Address { Id = "ADDR-01", UserID = userId };
            var customer = new User { UserID = userId };

            _unitOfWorkMock.Setup(u => u.Cart.GetCartByUserIdAsync(userId)).ReturnsAsync(cart);
            _unitOfWorkMock.Setup(u => u.CartItem.GetAllCartitemByCartIdAsync(cart.Id)).ReturnsAsync(cartItems);
            _unitOfWorkMock.Setup(u => u.Address.GetAddressByIdAsync(request.AddressId)).ReturnsAsync(address);
            _unitOfWorkMock.Setup(u => u.Users.GetByIdAsync(userId)).ReturnsAsync(customer);
            _unitOfWorkMock.Setup(u => u.Order.CreateOrderAsync(It.IsAny<Order>())).ReturnsAsync(true);
            _unitOfWorkMock.Setup(u => u.OrderDetail.CreateOrderItemAsync(It.IsAny<List<OrderItem>>())).ReturnsAsync(false);

            // Act
            var result = await _orderService.CreateOrderAsync(userId, request);

            // Assert
            Assert.False(result.Success);
        }



        [Fact(DisplayName = "GetOrderByIdAsync - Returns mapped order")]
        public async Task GetOrderByIdAsync_ShouldReturnMappedOrder()
        {
            // Arrange
            var orderId = "ORDER-01";
            var order = new Order
            {
                Id = orderId,
                OrderNumber = "ORD-20251120-123456789"
            };
            var expectedDto = new ResponseDTOOrder
            {
                OrderNumber = "ORD-20251120-123456789"
            };

            _unitOfWorkMock
                .Setup(u => u.Order.GetAllOrderByNumberAsync(orderId))
                .ReturnsAsync(order);

            _mapperMock
                .Setup(m => m.Map<ResponseDTOOrder>(order))
                .Returns(expectedDto);

            // Act
            var result = await _orderService.GetOrderByIdAsync(orderId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedDto, result);
        }


        [Fact(DisplayName = "GetOrderByIdAsync - Order not found returns null")]
        public async Task GetOrderByIdAsync_OrderNotFound_ReturnsNull()
        {
            // Arrange
            var orderId = "NON-EXIST";

            _unitOfWorkMock
                .Setup(u => u.Order.GetAllOrderByNumberAsync(orderId))
                .ReturnsAsync((Order?)null);

            // Act
            var result = await _orderService.GetOrderByIdAsync(orderId);

            // Assert
            Assert.Null(result);
        }


        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Returns all orders when filter is null")]
        public async Task GetAllOrderByUserIdAsync_NullFilter_ReturnsAll()
        {
            // Arrange
            var userId = "user-01";
            var orders = new List<Order>
            {
                new Order { OrderNumber = "ORD-001", Status = "Pending" },
                new Order { OrderNumber = "ORD-002", Status = "Completed" }
            };
            var dtos = orders.Select(o => new ResponseDTOOrder { OrderNumber = o.OrderNumber }).ToList();

            _unitOfWorkMock.Setup(u => u.Order.GetAllOrderByUserIdAsync(userId)).ReturnsAsync(orders);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOOrder>>(orders)).Returns(dtos);

            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(userId, null);

            // Assert
            Assert.Equal(2, result.Items.Count());
        }

        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Filters by search keyword")]
        public async Task GetAllOrderByUserIdAsync_FilterBySearch()
        {
            // Arrange
            var userId = "user-01";
            var orders = new List<Order>
            {
                new Order { OrderNumber = "ORDER-ABC-123" },
                new Order { OrderNumber = "ORDER-XYZ-999" }
            };

            _unitOfWorkMock.Setup(u => u.Order.GetAllOrderByUserIdAsync(userId)).ReturnsAsync(orders);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOOrder>>(It.IsAny<IEnumerable<Order>>()))
                .Returns((IEnumerable<Order> src) => src.Select(o => new ResponseDTOOrder { OrderNumber = o.OrderNumber }));

            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(userId, new RequestFilterOrder { search = "ABC" });

            // Assert
            Assert.Single(result.Items);
            Assert.Contains("ABC", result.Items.First().OrderNumber);
        }

        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Filters by Status")]
        public async Task GetAllOrderByUserIdAsync_FilterByStatus()
        {
            // Arrange
            var userId = "user-01";
            var orders = new List<Order>
            {
                new Order { Status = "Pending" },
                new Order { Status = "Completed" }
            };

            _unitOfWorkMock.Setup(u => u.Order.GetAllOrderByUserIdAsync(userId)).ReturnsAsync(orders);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOOrder>>(It.IsAny<IEnumerable<Order>>()))
                .Returns((IEnumerable<Order> src) => src.Select(o => new ResponseDTOOrder { Status = o.Status }));

            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(userId, new RequestFilterOrder { Status = "Completed" });

            // Assert
            Assert.Single(result.Items);
            Assert.Equal("Completed", result.Items.First().Status);
        }

        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Orders sorted by CreateAt desc")]
        public async Task GetAllOrderByUserIdAsync_SortByCreateAtDesc()
        {
            // Arrange
            var userId = "user-01";
            var newerDate = DateTime.UtcNow;
            var olderDate = newerDate.AddDays(-1);

            var orders = new List<Order>
            {
                new Order { CreateAt = olderDate },
                new Order { CreateAt = newerDate }
            };

            _unitOfWorkMock
                .Setup(u => u.Order.GetAllOrderByUserIdAsync(userId))
                .ReturnsAsync(orders);

            _mapperMock
                .Setup(m => m.Map<IEnumerable<ResponseDTOOrder>>(It.IsAny<IEnumerable<Order>>()))
                .Returns((IEnumerable<Order> src) =>
                    src.Select(o => new ResponseDTOOrder { CreateAt = o.CreateAt }));

            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(userId, new RequestFilterOrder());

            // Assert
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(newerDate, result.Items.First().CreateAt);
        }


        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Filters by all criteria combined")]
        public async Task GetAllOrderByUserIdAsync_FilterByAllCriteria()
        {
            // Arrange
            var userId = "user-01";
            var now = DateTime.UtcNow.Date;
            var orders = new List<Order>
            {
                new Order { OrderNumber = "ORDER-001", Status = "Pending", CreateAt = now },
                new Order { OrderNumber = "ORDER-002", Status = "Completed", CreateAt = now }
            };

            _unitOfWorkMock.Setup(u => u.Order.GetAllOrderByUserIdAsync(userId)).ReturnsAsync(orders);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOOrder>>(It.IsAny<IEnumerable<Order>>()))
                .Returns((IEnumerable<Order> src) => src.Select(o => new ResponseDTOOrder
                {
                    OrderNumber = o.OrderNumber,
                    Status = o.Status,
                    CreateAt = o.CreateAt
                }));

            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(userId, new RequestFilterOrder
            {
                search = "001",
                Status = "Pending",

            });

            // Assert
            Assert.Single(result.Items);
        }

        [Fact(DisplayName = "GetAllOrderByUserIdAsync - Invalid userId returns empty")]
        public async Task GetAllOrderByUserIdAsync_InvalidUserId_ReturnsEmpty()
        {
            // Act
            var result = await _orderService.GetAllOrderByUserIdAsync(null, null);

            // Assert
            Assert.Empty(result.Items);
        }
    }
}
