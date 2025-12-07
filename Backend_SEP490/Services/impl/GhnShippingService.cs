using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Backend_SEP490.Config;
using Backend_SEP490.DTOs.External.Ghn;
using Backend_SEP490.Models;
using Microsoft.Extensions.Options;

namespace Backend_SEP490.Services.impl;

public class GhnShippingService : IGhnShippingService
{
    private static readonly Uri CreateOrderEndpoint = new("/shiip/public-api/v2/shipping-order/create", UriKind.Relative);
    private static readonly Uri CancelOrderEndpoint = new("/shiip/public-api/v2/shipping-order/cancel", UriKind.Relative);
    private static readonly Uri CalculateFeeEndpoint = new("/shiip/public-api/v2/shipping-order/fee", UriKind.Relative);

    private readonly HttpClient _httpClient;
    private readonly GhnSettings _settings;
    private readonly ILogger<GhnShippingService> _logger;
    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = null
    };

    public GhnShippingService(
        HttpClient httpClient,
        IOptions<GhnSettings> options,
        ILogger<GhnShippingService> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value;
        _logger = logger;
    }

    public async Task<GhnCreateOrderResponse?> CreateShippingOrderAsync(
        Order order,
        IEnumerable<OrderItem> orderItems,
        Address shippingAddress,
        User customer,
        GhnShipmentOptions? shipmentOptions,
        IEnumerable<Product> products,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.Token) || _settings.ShopId <= 0)
        {
            _logger.LogWarning("GHN settings are missing Token or ShopId. Skipping shipping order creation.");
            return null;
        }

        if (_settings.FromDistrictId <= 0 ||
            string.IsNullOrWhiteSpace(_settings.FromWardCode) ||
            _settings.DefaultToDistrictId <= 0 ||
            string.IsNullOrWhiteSpace(_settings.DefaultToWardCode))
        {
            _logger.LogWarning("GHN settings are missing required district/ward codes. Skipping shipping order creation.");
            return null;
        }

        var productLookup = products
            .Where(p => !string.IsNullOrWhiteSpace(p.Id))
            .GroupBy(p => p.Id!)
            .ToDictionary(group => group.Key, group => group.First());

        var defaultItemWeight = Math.Max(_settings.DefaultItemWeight, 100);
        var weightOverrides = shipmentOptions?.ItemWeights ?? new Dictionary<string, int>();
        var items = orderItems.Select(item =>
        {
            productLookup.TryGetValue(item.ProductID, out var product);
            var itemName = product?.Name ?? item.ProductID;
            var unitPrice = (int)Math.Round(item.UnitPrice);
            var itemWeight = defaultItemWeight;
            if (weightOverrides.TryGetValue(item.ProductID, out var customWeight) && customWeight > 0)
            {
                itemWeight = customWeight;
            }
            return new GhnItem
            {
                Name = itemName,
                Code = item.ProductID,
                Quantity = item.Quantity,
                Price = Math.Max(unitPrice, 0),
                Weight = itemWeight
            };
        }).ToList();

        if (items.Count == 0)
        {
            _logger.LogWarning("Order {OrderId} does not contain any items to send to GHN.", order.Id);
            return null;
        }

        var totalWeight = shipmentOptions?.Weight ?? items.Sum(i => i.Weight * i.Quantity);
        if (totalWeight <= 0)
        {
            totalWeight = _settings.DefaultItemWeight * Math.Max(items.Count, 1);
        }

        var addressLine = BuildAddressLine(shippingAddress);
        var receiverName = !string.IsNullOrWhiteSpace(shipmentOptions?.ReceiverName)
            ? shipmentOptions!.ReceiverName!
            : customer.DisplayName ?? customer.Username ?? "Customer";
        var receiverPhone = !string.IsNullOrWhiteSpace(shipmentOptions?.ReceiverPhone)
            ? shipmentOptions!.ReceiverPhone!
            : customer.PhoneNumber ?? _settings.FallbackReceiverPhone ?? _settings.FromPhone;
        var toDistrictId = shipmentOptions?.ToDistrictId ?? _settings.DefaultToDistrictId;
        var toWardCode = !string.IsNullOrWhiteSpace(shipmentOptions?.ToWardCode)
            ? shipmentOptions!.ToWardCode!
            : _settings.DefaultToWardCode;
        var toAddress = !string.IsNullOrWhiteSpace(shipmentOptions?.ToAddress)
            ? shipmentOptions!.ToAddress!
            : addressLine;
        var toProvinceName = shipmentOptions?.ToProvinceName;
        if (toDistrictId <= 0 || string.IsNullOrWhiteSpace(toWardCode))
        {
            _logger.LogWarning("Missing destination district/ward for order {OrderId}.", order.Id);
            return null;
        }

        var length = shipmentOptions?.Length ?? _settings.DefaultParcelLength;
        var width = shipmentOptions?.Width ?? _settings.DefaultParcelWidth;
        var height = shipmentOptions?.Height ?? _settings.DefaultParcelHeight;

        var codAmount = shipmentOptions?.CodAmount ?? order.TotalAmount;
        var insuranceValue = shipmentOptions?.InsuranceValue ?? order.TotalAmount;

        var paymentTypeId = shipmentOptions?.PaymentTypeId ?? _settings.PaymentTypeId;
        var serviceTypeId = shipmentOptions?.ServiceTypeId ?? _settings.ServiceTypeId;
        var serviceId = shipmentOptions?.ServiceId ?? _settings.ServiceId;
        var requiredNote = string.IsNullOrWhiteSpace(shipmentOptions?.RequiredNote)
            ? _settings.RequiredNote
            : shipmentOptions!.RequiredNote!;

        var payload = new GhnCreateOrderRequest
        {
            PaymentTypeId = paymentTypeId,
            ServiceId = serviceId,
            ServiceTypeId = serviceTypeId,
            ClientOrderCode = order.OrderNumber ?? order.Id,
            CodAmount = Convert.ToInt32(Math.Round(codAmount)),
            InsuranceValue = Convert.ToInt32(Math.Round(insuranceValue)),
            RequiredNote = requiredNote,
            FromName = shipmentOptions?.FromName ?? _settings.FromName,
            FromPhone = shipmentOptions?.FromPhone ?? _settings.FromPhone,
            FromAddress = shipmentOptions?.FromAddress ?? _settings.FromAddress,
            FromDistrictId = shipmentOptions?.FromDistrictId ?? _settings.FromDistrictId,
            FromWardCode = shipmentOptions?.FromWardCode ?? _settings.FromWardCode,
            ToName = receiverName,
            ToPhone = receiverPhone,
            ToAddress = toAddress,
            ToProvinceName = toProvinceName,
            ToDistrictId = toDistrictId,
            ToWardCode = toWardCode,
            Weight = totalWeight,
            Length = Math.Max(length, 1),
            Width = Math.Max(width, 1),
            Height = Math.Max(height, 1),
            Items = items
        };

        var request = BuildJsonRequest(
            HttpMethod.Post,
            CreateOrderEndpoint,
            payload,
            shipmentOptions?.TokenOverride,
            shipmentOptions?.ShopIdOverride);
        var (success, content, statusCode) = await SendAsync(request, order.Id, cancellationToken);

        if (!success)
        {
            return new GhnCreateOrderResponse
            {
                Code = (int)statusCode,
                Message = content
            };
        }

        var parsed = JsonSerializer.Deserialize<GhnCreateOrderResponse>(content, _serializerOptions);
        if (parsed?.Data == null)
        {
            _logger.LogWarning("GHN response for order {OrderId} had no data. Payload: {Payload}", order.Id, content);
        }

        return parsed;
    }

    private static string BuildAddressLine(Address address)
    {
        var segments = new List<string>();
        if (!string.IsNullOrWhiteSpace(address.Line1))
        {
            segments.Add(address.Line1!);
        }
        if (!string.IsNullOrWhiteSpace(address.Line2))
        {
            segments.Add(address.Line2!);
        }
        if (!string.IsNullOrWhiteSpace(address.City))
        {
            segments.Add(address.City);
        }
        if (!string.IsNullOrWhiteSpace(address.Country))
        {
            segments.Add(address.Country);
        }

        return string.Join(", ", segments);
    }

    public async Task<bool> CancelOrderAsync(
        string? orderCode,
        string? clientOrderCode,
        string? reason = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.Token) || _settings.ShopId <= 0)
        {
            _logger.LogWarning("GHN settings are missing Token or ShopId. Skipping cancellation.");
            return false;
        }

        if (string.IsNullOrWhiteSpace(orderCode) && string.IsNullOrWhiteSpace(clientOrderCode))
        {
            _logger.LogWarning("Cannot cancel GHN order because both order code and client order code are empty.");
            return false;
        }

        var payload = new GhnCancelOrderRequest
        {
            OrderCodes = string.IsNullOrWhiteSpace(orderCode) ? null : new List<string> { orderCode },
            ClientOrderCodes = string.IsNullOrWhiteSpace(clientOrderCode) ? null : new List<string> { clientOrderCode },
            Reason = reason
        };

        var request = BuildJsonRequest(HttpMethod.Post, CancelOrderEndpoint, payload);
        var (success, content, statusCode) = await SendAsync(request, clientOrderCode ?? orderCode ?? "unknown", cancellationToken);
        if (!success)
        {
            return false;
        }

        var response = JsonSerializer.Deserialize<GhnBaseResponse>(content, _serializerOptions)
                        ?? new GhnBaseResponse { Code = (int)statusCode, Message = content };
        var successCodes = new[] { 0, 200 };
        if (!successCodes.Contains(response.Code))
        {
            _logger.LogWarning("GHN cancel order responded with code {Code}: {Message}", response.Code, response.Message);
            return false;
        }

        return true;
    }

    public async Task<GhnCalculateFeeResponse?> CalculateShippingFeeAsync(
        GhnCalculateFeeRequest requestModel,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.Token) || _settings.ShopId <= 0)
        {
            _logger.LogWarning("GHN settings are missing Token or ShopId. Unable to calculate shipping fee.");
            return null;
        }

        if (requestModel.ToDistrictId <= 0 || string.IsNullOrWhiteSpace(requestModel.ToWardCode))
        {
            _logger.LogWarning("Invalid destination data when calculating GHN shipping fee.");
            return null;
        }

        var shopId = requestModel.ShopId.HasValue && requestModel.ShopId.Value > 0
            ? requestModel.ShopId.Value
            : _settings.ShopId;

        var payload = new
        {
            shop_id = shopId,
            from_district_id = requestModel.FromDistrictId ?? _settings.FromDistrictId,
            from_ward_code = string.IsNullOrWhiteSpace(requestModel.FromWardCode)
                ? _settings.FromWardCode
                : requestModel.FromWardCode,
            service_id = requestModel.ServiceId,
            service_type_id = requestModel.ServiceTypeId ?? _settings.ServiceTypeId,
            to_district_id = requestModel.ToDistrictId,
            to_ward_code = requestModel.ToWardCode,
            height = requestModel.Height ?? _settings.DefaultParcelHeight,
            length = requestModel.Length ?? _settings.DefaultParcelLength,
            weight = requestModel.Weight > 0 ? requestModel.Weight : _settings.DefaultItemWeight,
            width = requestModel.Width ?? _settings.DefaultParcelWidth,
            insurance_value = requestModel.InsuranceValue ?? 0,
            coupon = requestModel.CouponCode
        };

        var request = BuildJsonRequest(HttpMethod.Post, CalculateFeeEndpoint, payload);
        var (success, content, statusCode) = await SendAsync(
            request,
            $"fee-{requestModel.ToDistrictId}-{requestModel.ToWardCode}",
            cancellationToken);

        if (!success)
        {
            return new GhnCalculateFeeResponse
            {
                Code = (int)statusCode,
                Message = string.IsNullOrWhiteSpace(content) ? "GHN fee request failed." : content
            };
        }

        var parsed = JsonSerializer.Deserialize<GhnCalculateFeeResponse>(content, _serializerOptions);
        if (parsed == null)
        {
            parsed = new GhnCalculateFeeResponse
            {
                Code = (int)statusCode,
                Message = content
            };
        }

        return parsed;
    }

    private HttpRequestMessage BuildJsonRequest(
        HttpMethod method,
        Uri endpoint,
        object payload,
        string? tokenOverride = null,
        int? shopIdOverride = null)
    {
        var json = JsonSerializer.Serialize(payload, _serializerOptions);
        var request = new HttpRequestMessage(method, endpoint)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        var token = string.IsNullOrWhiteSpace(tokenOverride) ? _settings.Token : tokenOverride!;
        var shopId = shopIdOverride.HasValue && shopIdOverride.Value > 0 ? shopIdOverride.Value : _settings.ShopId;
        request.Headers.TryAddWithoutValidation("Token", token);
        request.Headers.TryAddWithoutValidation("ShopId", shopId.ToString());
        return request;
    }

    private async Task<(bool Success, string Content, System.Net.HttpStatusCode StatusCode)> SendAsync(
        HttpRequestMessage request,
        string contextId,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await _httpClient.SendAsync(request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "GHN request failed for {Context}. Status: {Status}. Response: {Response}",
                    contextId,
                    response.StatusCode,
                    content);
                return (false, content, response.StatusCode);
            }

            return (true, content, response.StatusCode);
        }
        catch (TaskCanceledException ex) when (ex.CancellationToken == cancellationToken)
        {
            _logger.LogWarning(ex, "GHN request cancelled for {Context}", contextId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while calling GHN for {Context}", contextId);
            return (false, string.Empty, System.Net.HttpStatusCode.InternalServerError);
        }
    }
}
