using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Backend_SEP490.Constants;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Microsoft.EntityFrameworkCore.Storage;

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

    protected async Task RemoveUserCartItemsAsync(string? customerId, IEnumerable<string?>? productIds)
    {
        if (string.IsNullOrWhiteSpace(customerId))
        {
            return;
        }

        if (productIds == null)
        {
            return;
        }

        var normalizedProductIds = productIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (normalizedProductIds.Count == 0)
        {
            return;
        }

        var cart = await _context.Cart.GetCartByUserIdAsync(customerId);
        if (cart == null || cart.CartItems == null || cart.CartItems.Count == 0)
        {
            return;
        }

        foreach (var item in cart.CartItems.ToList())
        {
            if (item == null)
            {
                continue;
            }

            var productId = item.ProductId?.Trim();
            if (string.IsNullOrWhiteSpace(productId))
            {
                continue;
            }

            if (normalizedProductIds.Contains(productId))
            {
                await _context.CartItem.DeleteCartItemAsync(item);
            }
        }
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

        var quantities = orderItems
            .Where(item => !string.IsNullOrWhiteSpace(item.ProductID))
            .GroupBy(item => item.ProductID!.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.Sum(item => Math.Max(item.Quantity, 0)),
                StringComparer.OrdinalIgnoreCase);

        if (quantities.Count == 0)
        {
            return (false, "Order items missing product references.");
        }

        var startedTransaction = false;
        IDbContextTransaction? transaction = null;
        try
        {
            if (!_context.HasActiveTransaction())
            {
                transaction = await _context.BeginTransactionAsync();
                startedTransaction = true;
            }

            foreach (var entry in quantities)
            {
                var productId = entry.Key;
                var quantity = entry.Value;
                if (quantity <= 0)
                {
                    continue;
                }

                var affected = await _context.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE ""Products""
                       SET ""Stock"" = ""Stock"" - {quantity}
                       WHERE ""Id"" = {productId} AND ""IsActive"" = TRUE AND ""Stock"" >= {quantity}");

                if (affected <= 0)
                {
                    var product = await _context.Products.GetProductByIdAsync(productId);
                    var displayName = product?.Name ?? productId;
                    var available = product?.Stock ?? 0;
                    var isActive = product?.IsActive ?? true;
                    var reason = !isActive ? "is inactive" : $"only has {available} item(s) left";

                    if (startedTransaction && transaction != null)
                    {
                        await transaction.RollbackAsync();
                    }

                    return (false, $"Product {displayName} {reason}.");
                }
            }

            order.IsInventoryReserved = true;
            if (startedTransaction)
            {
                await _context.SaveChangesAsync();
                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }
            }

            return (true, null);
        }
        catch
        {
            if (startedTransaction && transaction != null)
            {
                await transaction.RollbackAsync();
            }
            throw;
        }
        finally
        {
            if (startedTransaction && transaction != null)
            {
                await transaction.DisposeAsync();
            }
        }
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

        var quantities = orderItems
            .Where(item => !string.IsNullOrWhiteSpace(item.ProductID))
            .GroupBy(item => item.ProductID!.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.Sum(item => Math.Max(item.Quantity, 0)),
                StringComparer.OrdinalIgnoreCase);

        if (quantities.Count == 0)
        {
            order.IsInventoryReserved = false;
            return;
        }

        var startedTransaction = false;
        IDbContextTransaction? transaction = null;
        try
        {
            if (!_context.HasActiveTransaction())
            {
                transaction = await _context.BeginTransactionAsync();
                startedTransaction = true;
            }

            foreach (var entry in quantities)
            {
                var productId = entry.Key;
                var quantity = entry.Value;
                if (quantity <= 0)
                {
                    continue;
                }

                await _context.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE ""Products""
                       SET ""Stock"" = ""Stock"" + {quantity}
                       WHERE ""Id"" = {productId}");
            }

            order.IsInventoryReserved = false;

            if (startedTransaction)
            {
                await _context.SaveChangesAsync();
                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }
            }
        }
        catch
        {
            if (startedTransaction && transaction != null)
            {
                await transaction.RollbackAsync();
            }
            throw;
        }
        finally
        {
            if (startedTransaction && transaction != null)
            {
                await transaction.DisposeAsync();
            }
        }
    }

    protected async Task ReleaseVoucherUsageAsync(int? voucherId)
    {
        if (!voucherId.HasValue || voucherId.Value <= 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        await _context.ExecuteSqlInterpolatedAsync(
            $@"UPDATE ""Vouchers""
               SET ""UsedCount"" = ""UsedCount"" - 1,
                   ""IsActive"" = CASE
                       WHEN (""UsedCount"" - 1) < ""UsageLimit"" AND ""StartDate"" <= {now} AND ""EndDate"" >= {now} THEN TRUE
                       ELSE ""IsActive""
                   END
               WHERE ""VoucherId"" = {voucherId.Value}
                 AND ""UsageLimit"" IS NOT NULL
               AND ""UsedCount"" > 0");
    }

    protected async Task ReleaseVoucherUsageForPotentialGroupAsync(Order? order)
    {
        if (order == null)
        {
            return;
        }

        if (!order.VoucherId.HasValue || order.VoucherId.Value <= 0)
        {
            return;
        }

        var voucherCode = string.IsNullOrWhiteSpace(order.VoucherCode) ? null : order.VoucherCode.Trim();
        if (string.IsNullOrWhiteSpace(voucherCode) || string.IsNullOrWhiteSpace(order.CustomerId))
        {
            await ReleaseVoucherUsageAsync(order.VoucherId);
            return;
        }

        // Heuristic: multi-shop checkouts create multiple orders within a short window sharing the same voucher code.
        // Only release voucher usage when this is the last active order in that recent group.
        var lookbackStart = order.CreateAt.Subtract(TimeSpan.FromMinutes(10));
        var recentOrders = await _context.Order.GetRecentOrdersForCustomerAsync(order.CustomerId, lookbackStart, 20);

        var hasOtherActiveInGroup = recentOrders.Any(o =>
            o != null
            && !string.Equals(o.Id, order.Id, StringComparison.OrdinalIgnoreCase)
            && o.VoucherId.HasValue
            && o.VoucherId.Value == order.VoucherId.Value
            && string.Equals(o.VoucherCode, voucherCode, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(o.Status, OrderStatuses.Cancelled, StringComparison.OrdinalIgnoreCase));

        if (hasOtherActiveInGroup)
        {
            return;
        }

        await ReleaseVoucherUsageAsync(order.VoucherId);
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
