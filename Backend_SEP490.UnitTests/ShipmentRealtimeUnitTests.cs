using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Hubs;
using Backend_SEP490.Models;
using Backend_SEP490.Services.impl;
using Microsoft.AspNetCore.SignalR;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class ShipmentRealtimeUnitTests
    {
        private readonly Mock<IHubContext<NotificationHub, INotificationClient>> _hubContextMock;
        private readonly Mock<INotificationClient> _clientMock;
        private readonly Mock<IGroupManager> _groupManagerMock;
        private readonly ShipmentRealtimeService _service;

        public ShipmentRealtimeUnitTests()
        {
            _hubContextMock = new Mock<IHubContext<NotificationHub, INotificationClient>>();
            _clientMock = new Mock<INotificationClient>();
            _groupManagerMock = new Mock<IGroupManager>();

            var clientsMock = new Mock<IHubClients<INotificationClient>>();
            var clientProxyMock = new Mock<INotificationClient>();

            clientsMock.Setup(c => c.Group(It.IsAny<string>()))
                       .Returns(clientProxyMock.Object);

            _hubContextMock.Setup(h => h.Clients).Returns(clientsMock.Object);

            _service = new ShipmentRealtimeService(_hubContextMock.Object);
        }

        [Fact]
        public async Task BroadcastAsync_DoesNothing_WhenUserIdIsNullOrEmpty()
        {
            var shipment = new Shipment { Id = "S1", OrderID = "O1", ShippingStatus = "Pending" };

            await _service.BroadcastAsync(null!, shipment);
            await _service.BroadcastAsync("", shipment);

            _hubContextMock.Verify(h => h.Clients, Times.Never);
        }

        [Fact]
        public async Task BroadcastAsync_DoesNothing_WhenShipmentIsNull()
        {
            await _service.BroadcastAsync("U1", null!);

            _hubContextMock.Verify(h => h.Clients, Times.Never);
        }

        [Fact]
        public async Task BroadcastAsync_CallsShipmentStatusUpdated_WithCorrectPayload()
        {
            var userId = "U1";
            var shipment = new Shipment
            {
                Id = "S1",
                OrderID = "O1",
                TrackingNumber = "TRK123",
                ShippingStatus = "Shipped"
            };
            var note = "Test note";

            ShipmentStatusUpdateDto? capturedPayload = null;

            var clientsMock = new Mock<IHubClients<INotificationClient>>();
            var clientProxyMock = new Mock<INotificationClient>();
            clientProxyMock.Setup(c => c.ShipmentStatusUpdated(It.IsAny<ShipmentStatusUpdateDto>()))
                           .Callback<ShipmentStatusUpdateDto>(payload => capturedPayload = payload)
                           .Returns(Task.CompletedTask);

            clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(clientProxyMock.Object);
            _hubContextMock.Setup(h => h.Clients).Returns(clientsMock.Object);

            var service = new ShipmentRealtimeService(_hubContextMock.Object);

            await service.BroadcastAsync(userId, shipment, note);

            Assert.NotNull(capturedPayload);
            Assert.Equal("S1", capturedPayload!.ShipmentId);
            Assert.Equal("O1", capturedPayload.OrderId);
            Assert.Equal("TRK123", capturedPayload.TrackingNumber);
            Assert.Equal("Shipped", capturedPayload.Status);
            Assert.Equal(note, capturedPayload.Note);
            Assert.True((DateTime.UtcNow - capturedPayload.Timestamp).TotalSeconds < 5);

            clientsMock.Verify(c => c.Group(NotificationHub.GetUserGroup(userId)), Times.Once);
            clientProxyMock.Verify(c => c.ShipmentStatusUpdated(It.IsAny<ShipmentStatusUpdateDto>()), Times.Once);
        }
    }
}
