using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services;

public class GenericServices
{
    protected readonly IMapper _mapper;
    protected readonly IUnitOfWork _context;

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
                await _context.CartItem.DeleteCartItemAsync(item);
            }
        }

        await _context.Cart.DeleteCartAsync(cart);
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
}
