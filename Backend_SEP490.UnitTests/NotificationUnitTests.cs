using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Hubs;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.UnitTests
{
    public class NotificationServicesUnitTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IHubContext<NotificationHub, INotificationClient>> _hubContextMock;
        private readonly Mock<ILogger<NotificationServicesImpl>> _loggerMock;
        private readonly Mock<INotificationClient> _clientMock;
        private readonly NotificationServicesImpl _service;

        public NotificationServicesUnitTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _loggerMock = new Mock<ILogger<NotificationServicesImpl>>();

            _clientMock = new Mock<INotificationClient>();
            var clients = new Mock<IHubClients<INotificationClient>>();
            clients.Setup(c => c.Group(It.IsAny<string>())).Returns(_clientMock.Object);
            _hubContextMock = new Mock<IHubContext<NotificationHub, INotificationClient>>();
            _hubContextMock.Setup(h => h.Clients).Returns(clients.Object);

            _unitOfWorkMock.Setup(u => u.Notifications.AddRangeAsync(It.IsAny<IEnumerable<Notification>>()))
                           .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.Notifications.AddAsync(It.IsAny<Notification>()))
                           .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _service = new NotificationServicesImpl(
                _mapperMock.Object,
                _unitOfWorkMock.Object,
                _hubContextMock.Object,
                _loggerMock.Object);
        }

        // ==================================================================
        // GetNotificationsAsync
        // ==================================================================

        [Fact(DisplayName = "GetNotificationsAsync - Returns paged + mapped DTOs")]
        public async Task GetNotificationsAsync_Valid_ReturnsPagedResult()
        {
            var notis = new List<Notification> { new Notification { Id = "N1" } };
            _unitOfWorkMock.Setup(u => u.Notifications.GetByUserAsync("U1", 1, 20, null, null))
                           .ReturnsAsync(notis);
            _unitOfWorkMock.Setup(u => u.Notifications.CountByUserAsync("U1", null, null))
                           .ReturnsAsync(5);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseNotificationDto>>(notis))
                       .Returns(new List<ResponseNotificationDto> { new ResponseNotificationDto() });

            var result = await _service.GetNotificationsAsync("U1", new NotificationFilterRequest());

            Assert.Equal(5, result.TotalCount);
            Assert.Single(result.Items);
        }

        // ==================================================================
        // MarkAsReadAsync
        // ==================================================================

        [Fact(DisplayName = "MarkAsReadAsync - Invalid params → false")]
        public async Task MarkAsReadAsync_InvalidParams_ReturnsFalse()
        {
            Assert.False(await _service.MarkAsReadAsync("", "N1"));
            Assert.False(await _service.MarkAsReadAsync("U1", ""));
        }

        [Fact(DisplayName = "MarkAsReadAsync - Not found or not owned → false")]
        public async Task MarkAsReadAsync_NotOwned_ReturnsFalse()
        {
            _unitOfWorkMock.Setup(u => u.Notifications.FindByIdAsync("N1"))
                           .ReturnsAsync((Notification)null);
            Assert.False(await _service.MarkAsReadAsync("U1", "N1"));

            var noti = new Notification { UserID = "U999" };
            _unitOfWorkMock.Setup(u => u.Notifications.FindByIdAsync("N1")).ReturnsAsync(noti);
            Assert.False(await _service.MarkAsReadAsync("U1", "N1"));
        }

        [Fact(DisplayName = "MarkAsReadAsync - Valid → Marks read + SignalR")]
        public async Task MarkAsReadAsync_Valid_Success()
        {
            var noti = new Notification { Id = "N1", UserID = "U1", IsRead = false };
            _unitOfWorkMock.Setup(u => u.Notifications.FindByIdAsync("N1")).ReturnsAsync(noti);

            var result = await _service.MarkAsReadAsync("U1", "N1");

            Assert.True(result);
            Assert.True(noti.IsRead);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _clientMock.Verify(c => c.NotificationRead("N1"), Times.Once);
        }

        // ==================================================================
        // MarkAllAsReadAsync
        // ==================================================================

        [Fact(DisplayName = "MarkAllAsReadAsync - Empty userId → 0")]
        public async Task MarkAllAsReadAsync_EmptyUserId_ReturnsZero()
            => Assert.Equal(0, await _service.MarkAllAsReadAsync(""));

        [Fact(DisplayName = "MarkAllAsReadAsync - No unread → 0")]
        public async Task MarkAllAsReadAsync_NoUnread_ReturnsZero()
        {
            _unitOfWorkMock.Setup(u => u.Notifications.MarkAllAsReadAsync("U1"))
                           .ReturnsAsync(new List<string>());
            Assert.Equal(0, await _service.MarkAllAsReadAsync("U1"));
        }

        [Fact(DisplayName = "MarkAllAsReadAsync - Valid → Returns count + SignalR")]
        public async Task MarkAllAsReadAsync_Valid_Success()
        {
            var ids = new List<string> { "N1", "N2" };
            _unitOfWorkMock.Setup(u => u.Notifications.MarkAllAsReadAsync("U1"))
                           .ReturnsAsync(ids);

            var count = await _service.MarkAllAsReadAsync("U1");

            Assert.Equal(2, count);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _clientMock.Verify(c => c.NotificationsMarkedAsRead(ids), Times.Once);
        }

        // ==================================================================
        // RemoveAsync
        // ==================================================================

        [Fact(DisplayName = "RemoveAsync - Valid → Remove + SignalR")]
        public async Task RemoveAsync_Valid_Success()
        {
            var noti = new Notification { Id = "N1", UserID = "U1" };
            _unitOfWorkMock.Setup(u => u.Notifications.FindByIdAsync("N1")).ReturnsAsync(noti);

            var result = await _service.RemoveAsync("U1", "N1");

            Assert.True(result);
            _unitOfWorkMock.Verify(u => u.Notifications.Remove(noti), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _clientMock.Verify(c => c.NotificationDeleted("N1"), Times.Once);
        }

        // ==================================================================
        // NotifyAdminsProductReportedAsync
        // ==================================================================

        [Fact(DisplayName = "NotifyAdminsProductReportedAsync - Sends to Artisan + All Admins")]
        public async Task NotifyAdminsProductReportedAsync_SendsCorrectly()
        {
            var report = new Report { Id = "REP-1", Reason = "Fake", TargetID = "P1" };
            var product = new Product { Name = "Vase", ArtisanId = "ART001" };
            var reporter = new User { DisplayName = "John" };
            var admins = new List<User>
                {
                    new User { UserID = "A1" },
                    new User { UserID = "A2" }
                };

            _unitOfWorkMock.Setup(u => u.Users.GetUsersByRoleAsync("Admin"))
                           .ReturnsAsync(admins);
            _mapperMock.Setup(m => m.Map<ResponseNotificationDto>(It.IsAny<Notification>()))
                       .Returns<Notification>(n => new ResponseNotificationDto
                       {
                           Id = n.Id ?? "NOTI-TEST",
                           UserId = n.UserID,
                           Message = n.Message,
                           Type = n.Type,
                           IsRead = n.IsRead,
                           CreateAt = n.CreateAt
                       });

            await _service.NotifyAdminsProductReportedAsync(report, product, reporter);

            _unitOfWorkMock.Verify(u => u.Notifications.AddRangeAsync(
                It.Is<List<Notification>>(l => l.Count == 3)), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _clientMock.Verify(c => c.ReceiveNotification(It.IsAny<ResponseNotificationDto>()), Times.Exactly(3));
        }

        // ==================================================================
        // AdminSendNotificationAsync
        // ==================================================================

        [Fact(DisplayName = "AdminSendNotificationAsync - Success")]
        public async Task AdminSendNotificationAsync_Valid_Success()
        {
            var req = new AdminSendNotificationRequest
            {
                TargetUserId = "U1",
                Message = "Hello",
                Type = "Custom"
            };

            _unitOfWorkMock.Setup(u => u.Users.GetByIdAsync("U1"))
                           .ReturnsAsync(new User { UserID = "U1" });
            _mapperMock.Setup(m => m.Map<ResponseNotificationDto>(It.IsAny<Notification>()))
                       .Returns<Notification>(n => new ResponseNotificationDto
                       {
                           Id = n.Id,
                           UserId = n.UserID,
                           Message = n.Message,
                           Type = n.Type,
                           IsRead = n.IsRead,
                           CreateAt = n.CreateAt
                       });

            // Act
            await _service.AdminSendNotificationAsync("ADMIN123", req);

            // Assert
            _unitOfWorkMock.Verify(u => u.Notifications.AddAsync(It.IsAny<Notification>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _clientMock.Verify(c => c.ReceiveNotification(It.IsAny<ResponseNotificationDto>()), Times.Once);
        }

        // ==================================================================
        // VALIDATION TESTS – AdminSendNotificationRequest
        // ==================================================================

        public static IEnumerable<object[]> MessageLengthData => new List<object[]>
        {
            new object[] { null, false },
            new object[] { "", false },
            new object[] { "Valid message", true },
            new object[] { new string('A', 500), true },
            new object[] { new string('A', 501), false }
        };

        [Theory(DisplayName = "AdminSendNotificationRequest - Message required + max 500 chars")]
        [MemberData(nameof(MessageLengthData))]
        public void AdminSendNotificationRequest_Message_Validation(string? message, bool expected)
        {
            var req = new AdminSendNotificationRequest
            {
                TargetUserId = "U1",
                Message = message,
                Type = "Custom"
            };

            var isValid = Validator.TryValidateObject(req, new ValidationContext(req), null, true);
            Assert.Equal(expected, isValid);
        }

        [Fact(DisplayName = "AdminSendNotificationRequest - TargetUserId required")]
        public void AdminSendNotificationRequest_TargetUserId_Required()
        {
            var req = new AdminSendNotificationRequest { Message = "Test" };
            var results = new List<ValidationResult>();
            var isValid = Validator.TryValidateObject(req, new ValidationContext(req), results, true);
            Assert.False(isValid);
            Assert.Contains(results, r => r.MemberNames.Contains(nameof(req.TargetUserId)));
        }
    }
}