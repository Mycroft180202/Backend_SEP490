using System;
using System.Collections.Generic;

namespace Backend_SEP490.DTOs.Response;

public class RealtimeCartDto
{
    public string? CartId { get; set; }
    public int TotalItems { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public IReadOnlyCollection<RealtimeCartItemDto> Items { get; set; } = Array.Empty<RealtimeCartItemDto>();
}

public class RealtimeCartItemDto
{
    public string? CartItemId { get; set; }
    public string? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ImageUrl { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public int AvailableStock { get; set; }
}

public class RealtimeCartItemAdjustmentDto
{
    public string? UserId { get; set; }
    public string? CartId { get; set; }
    public string? CartItemId { get; set; }
    public string? ProductId { get; set; }
    public string? ProductName { get; set; }
    public int RequestedQuantity { get; set; }
    public int AppliedQuantity { get; set; }
    public int AvailableStock { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class RealtimeOrderDto
{
    public string? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? Status { get; set; }
    public decimal TotalAmount { get; set; }
    public string? PaymentType { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? Message { get; set; }
}

public class RealtimePaymentDto
{
    public string? PaymentId { get; set; }
    public string? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? Status { get; set; }
    public decimal Amount { get; set; }
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    public string? ProviderCode { get; set; }
}

public class RealtimeProductStockDto
{
    public string? ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; }
    public bool IsOutOfStock => Stock <= 0;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
