namespace Backend_SEP490.DTOs.Response;

public sealed record CreateOrderResult(bool Success, string Message, string? OrderId)
{
    public static CreateOrderResult Failure(string message) => new(false, message, null);
    public static CreateOrderResult Succeeded(string orderId) =>
        new(true, "Create order successfully!", orderId);
}
