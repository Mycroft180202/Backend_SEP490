using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services;

public class GenericServices
{
    protected readonly IMapper _mapper;
    protected readonly IUnitOfWork _context;
    protected const string CartStockAdjustmentReasonOutOfStock = "OutOfStock";
    protected const string CartStockAdjustmentReasonLimited = "LimitedByStock";

    protected record CartStockAdjustment(
        string UserId,
        string CartId,
        string CartItemId,
        string ProductId,
        string? ProductName,
        int RequestedQuantity,
        int AppliedQuantity,
        int AvailableStock,
        string Reason);

    public GenericServices(IMapper mapper, IUnitOfWork unitOfWork)
    {
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _context = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    protected async Task ClearUserCartAsync(string? customerId)
    {
        if (string.IsNullOrWhiteSpace(customerId))
        {
            return;
        }

        var cart = await _context.Cart.GetCartByUserIdAsync(customerId);
        if (cart == null)
        {
            return;
        }

        if (cart.CartItems != null)
        {
            foreach (var item in cart.CartItems.ToList())
            {
                if(item.Product.Stock == 0 || item.Product.Stock < item.Quantity)
                {

                }
                else
                {
                    await _context.CartItem.DeleteCartItemAsync(item);
                }
                    
            }
        }

        //await _context.Cart.DeleteCartAsync(cart);
    }

    protected async Task<List<OrderItem>> EnsureOrderItemsLoadedAsync(Order? order)
    {
        if (order == null)
        {
            return new List<OrderItem>();
        }

        if (order.OrderItems != null && order.OrderItems.Any())
        {
            return order.OrderItems.ToList();
        }

        if (string.IsNullOrWhiteSpace(order.Id))
        {
            return new List<OrderItem>();
        }

        var items = await _context.OrderDetail.GetAllOrderItemAsync(order.Id);
        order.OrderItems = items;
        return items;
    }

    protected async Task<(bool Success, string? Message)> ReserveOrderStockAsync(Order order)
    {
        if (order == null)
        {
            return (false, "Order not found.");
        }

        if (order.IsInventoryReserved)
        {
            return (true, null);
        }

        var orderItems = await EnsureOrderItemsLoadedAsync(order);
        if (orderItems == null || orderItems.Count == 0)
        {
            return (false, "Order has no items.");
        }

        var productIds = orderItems
            .Where(item => !string.IsNullOrWhiteSpace(item.ProductID))
            .Select(item => item.ProductID!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (productIds.Count == 0)
        {
            return (false, "Order items missing product references.");
        }

        var products = await _context.Products.GetProductsByIdsAsync(productIds);
        var lookup = products
            .Where(p => !string.IsNullOrWhiteSpace(p.Id))
            .ToDictionary(p => p.Id!.Trim(), StringComparer.OrdinalIgnoreCase);

        foreach (var item in orderItems)
        {
            if (string.IsNullOrWhiteSpace(item.ProductID) ||
                !lookup.TryGetValue(item.ProductID.Trim(), out var product))
            {
                return (false, $"Product {item.ProductID ?? "unknown"} not found.");
            }

            if (product.Stock < item.Quantity)
            {
                return (false, $"Product {product.Name} only has {product.Stock} item(s) left.");
            }
        }

        foreach (var item in orderItems)
        {
            var product = lookup[item.ProductID!.Trim()];
            var quantity = Math.Max(item.Quantity, 0);
            product.Stock = Math.Max(0, product.Stock - quantity);
        }

        order.IsInventoryReserved = true;
        return (true, null);
    }

    protected async Task RestoreOrderStockAsync(Order? order)
    {
        if (order == null || !order.IsInventoryReserved)
        {
            return;
        }

        var orderItems = await EnsureOrderItemsLoadedAsync(order);
        if (orderItems == null || orderItems.Count == 0)
        {
            order.IsInventoryReserved = false;
            return;
        }

        var productIds = orderItems
            .Where(item => !string.IsNullOrWhiteSpace(item.ProductID))
            .Select(item => item.ProductID!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (productIds.Count == 0)
        {
            order.IsInventoryReserved = false;
            return;
        }

        var products = await _context.Products.GetProductsByIdsAsync(productIds);
        var lookup = products
            .Where(p => !string.IsNullOrWhiteSpace(p.Id))
            .ToDictionary(p => p.Id!.Trim(), StringComparer.OrdinalIgnoreCase);

        foreach (var item in orderItems)
        {
            if (string.IsNullOrWhiteSpace(item.ProductID))
            {
                continue;
            }

            if (lookup.TryGetValue(item.ProductID.Trim(), out var product))
            {
                product.Stock += Math.Max(item.Quantity, 0);
            }
        }

        order.IsInventoryReserved = false;
    }

    protected async Task<IReadOnlyList<CartStockAdjustment>> SynchronizeCartItemsWithProductStockAsync(
        string productId,
        string? excludeUserId = null)
    {
        if (string.IsNullOrWhiteSpace(productId))
        {
            return Array.Empty<CartStockAdjustment>();
        }

        var product = await _context.Products.GetProductByIdAsync(productId);
        if (product == null)
        {
            return Array.Empty<CartStockAdjustment>();
        }

        var cartItems = await _context.CartItem.GetCartItemsByProductIdWithCartAsync(productId);
        if (cartItems == null || cartItems.Count == 0)
        {
            return Array.Empty<CartStockAdjustment>();
        }

        var availableStock = Math.Max(product.Stock, 0);
        var adjustments = new List<CartStockAdjustment>();

        foreach (var cartItem in cartItems)
        {
            var cart = cartItem.Cart;
            var userId = cart?.CustomerID;
            if (string.IsNullOrWhiteSpace(userId))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(excludeUserId) &&
                string.Equals(userId, excludeUserId, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var requestedQuantity = Math.Max(cartItem.Quantity ?? 0, 0);
            if (availableStock <= 0)
            {
                await _context.CartItem.DeleteCartItemAsync(cartItem);
                adjustments.Add(new CartStockAdjustment(
                    userId,
                    cart?.Id ?? string.Empty,
                    cartItem.Id,
                    cartItem.ProductId ?? product.Id,
                    cartItem.Product?.Name ?? product.Name,
                    requestedQuantity,
                    0,
                    availableStock,
                    CartStockAdjustmentReasonOutOfStock));
                continue;
            }

            if (requestedQuantity <= availableStock)
            {
                continue;
            }

            await _context.CartItem.UpdateCartItemAsync(cartItem, availableStock);
            adjustments.Add(new CartStockAdjustment(
                userId,
                cart?.Id ?? string.Empty,
                cartItem.Id,
                cartItem.ProductId ?? product.Id,
                cartItem.Product?.Name ?? product.Name,
                requestedQuantity,
                availableStock,
                availableStock,
                CartStockAdjustmentReasonLimited));
        }

        return adjustments;
    }

    protected IEnumerable<RealtimeCartItemAdjustmentDto> BuildCartAdjustmentDtos(IEnumerable<CartStockAdjustment> adjustments)
    {
        if (adjustments == null)
        {
            yield break;
        }

        foreach (var adjustment in adjustments)
        {
            if (adjustment == null || string.IsNullOrWhiteSpace(adjustment.UserId))
            {
                continue;
            }

            yield return new RealtimeCartItemAdjustmentDto
            {
                UserId = adjustment.UserId,
                CartId = string.IsNullOrWhiteSpace(adjustment.CartId) ? null : adjustment.CartId,
                CartItemId = adjustment.CartItemId,
                ProductId = adjustment.ProductId,
                ProductName = adjustment.ProductName,
                RequestedQuantity = adjustment.RequestedQuantity,
                AppliedQuantity = adjustment.AppliedQuantity,
                AvailableStock = adjustment.AvailableStock,
                Reason = adjustment.Reason,
                GeneratedAt = DateTime.UtcNow
            };
        }
    }
}
