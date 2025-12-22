using System;
using System.Collections.Generic;
using System.Linq;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Backend_SEP490.Services.impl;

public class CommerceRealtimeService : ICommerceRealtimeService
{
    private readonly IHubContext<NotificationHub, INotificationClient> _hubContext;

    public CommerceRealtimeService(IHubContext<NotificationHub, INotificationClient> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task SendCartSnapshotAsync(string userId, ResponseDTOCart cart)
    {
        if (string.IsNullOrWhiteSpace(userId) || cart == null)
        {
            return Task.CompletedTask;
        }

        var dto = MapToCartRealtimeDto(cart);
        return _hubContext.Clients
            .Group(NotificationHub.GetUserGroup(userId))
            .CartUpdated(dto);
    }

    public Task SendCartAdjustmentsAsync(IEnumerable<RealtimeCartItemAdjustmentDto> adjustments)
    {
        if (adjustments == null)
        {
            return Task.CompletedTask;
        }

        var tasks = adjustments
            .Where(adj =>
                !string.IsNullOrWhiteSpace(adj.UserId) &&
                !string.IsNullOrWhiteSpace(adj.ProductId))
            .Select(adj => _hubContext.Clients
                .Group(NotificationHub.GetUserGroup(adj.UserId!))
                .CartItemAdjusted(adj));

        return Task.WhenAll(tasks);
    }

    public Task SendOrderUpdateAsync(string userId, RealtimeOrderDto orderUpdate)
    {
        if (string.IsNullOrWhiteSpace(userId) || orderUpdate == null)
        {
            return Task.CompletedTask;
        }

        return _hubContext.Clients
            .Group(NotificationHub.GetUserGroup(userId))
            .OrderUpdated(orderUpdate);
    }

    public Task SendPaymentUpdateAsync(string userId, RealtimePaymentDto paymentUpdate)
    {
        if (string.IsNullOrWhiteSpace(userId) || paymentUpdate == null)
        {
            return Task.CompletedTask;
        }

        return _hubContext.Clients
            .Group(NotificationHub.GetUserGroup(userId))
            .PaymentUpdated(paymentUpdate);
    }

    public Task BroadcastProductStockAsync(IEnumerable<RealtimeProductStockDto> updates)
    {
        if (updates == null)
        {
            return Task.CompletedTask;
        }

        var payload = updates
            .Where(update => !string.IsNullOrWhiteSpace(update.ProductId))
            .ToList();

        if (payload.Count == 0)
        {
            return Task.CompletedTask;
        }

        var tasks = payload.Select(update => _hubContext.Clients.All.ProductStockUpdated(update));
        return Task.WhenAll(tasks);
    }

    private static RealtimeCartDto MapToCartRealtimeDto(ResponseDTOCart cart)
    {
        var items = cart.CartItems?.Items ?? Enumerable.Empty<ResponseDTOCartItem>();
        var realtimeItems = items
            .Select(item => new RealtimeCartItemDto
            {
                CartItemId = item.Id,
                ProductId = item.Product?.Id,
                ProductName = item.Product?.Name,
                ImageUrl = item.Product?.ImageUrl,
                UnitPrice = item.PriceAtAdd ?? item.Product?.Price ?? 0,
                Quantity = item.Quantity ?? 0,
                AvailableStock = item.Product?.Stock ?? 0
            })
            .ToList();

        return new RealtimeCartDto
        {
            CartId = cart.CartId,
            TotalItems = realtimeItems.Count,
            TotalQuantity = realtimeItems.Sum(i => i.Quantity),
            TotalAmount = realtimeItems.Sum(i => i.UnitPrice * i.Quantity),
            GeneratedAt = DateTime.UtcNow,
            Items = realtimeItems
        };
    }
}
