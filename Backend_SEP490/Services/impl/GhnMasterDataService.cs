using System.Text;
using System.Text.Json;
using Backend_SEP490.Config;
using Backend_SEP490.DTOs.External.Ghn;
using Microsoft.Extensions.Options;

namespace Backend_SEP490.Services.impl;

public class GhnMasterDataService : IGhnMasterDataService
{
    private static readonly Uri ProvinceEndpoint = new("/shiip/public-api/master-data/province", UriKind.Relative);
    private static readonly Uri DistrictEndpoint = new("/shiip/public-api/master-data/district", UriKind.Relative);
    private static readonly Uri WardEndpoint = new("/shiip/public-api/master-data/ward", UriKind.Relative);

    private readonly HttpClient _httpClient;
    private readonly GhnSettings _settings;
    private readonly ILogger<GhnMasterDataService> _logger;
    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        PropertyNamingPolicy = null
    };

    public GhnMasterDataService(
        HttpClient httpClient,
        IOptions<GhnSettings> options,
        ILogger<GhnMasterDataService> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value;
        _logger = logger;
    }

    public async Task<IEnumerable<GhnProvince>> GetProvincesAsync(CancellationToken cancellationToken = default)
    {
        var request = BuildRequest(ProvinceEndpoint, "{}");
        var response = await SendAsync<GhnProvince>(request, cancellationToken);
        return response ?? Enumerable.Empty<GhnProvince>();
    }

    public async Task<IEnumerable<GhnDistrict>> GetDistrictsAsync(int provinceId, CancellationToken cancellationToken = default)
    {
        var payload = JsonSerializer.Serialize(new { province_id = provinceId });
        var request = BuildRequest(DistrictEndpoint, payload);
        var response = await SendAsync<GhnDistrict>(request, cancellationToken);
        return response ?? Enumerable.Empty<GhnDistrict>();
    }

    public async Task<IEnumerable<GhnWard>> GetWardsAsync(int districtId, CancellationToken cancellationToken = default)
    {
        var payload = JsonSerializer.Serialize(new { district_id = districtId });
        var request = BuildRequest(WardEndpoint, payload);
        var response = await SendAsync<GhnWard>(request, cancellationToken);
        return response ?? Enumerable.Empty<GhnWard>();
    }

    private HttpRequestMessage BuildRequest(Uri endpoint, string payload)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        request.Headers.TryAddWithoutValidation("Token", _settings.Token);
        request.Headers.TryAddWithoutValidation("ShopId", _settings.ShopId.ToString());
        return request;
    }

    private async Task<IEnumerable<T>?> SendAsync<T>(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _httpClient.SendAsync(request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("GHN master data request failed: {Status} - {Content}", response.StatusCode, content);
                return null;
            }

            var parsed = JsonSerializer.Deserialize<GhnMasterDataResponse<T>>(content, _serializerOptions);
            if (parsed?.Data == null)
            {
                _logger.LogWarning("GHN master data response missing data. Payload: {Payload}", content);
            }

            return parsed?.Data;
        }
        catch (Exception ex) when (ex is not TaskCanceledException)
        {
            _logger.LogError(ex, "Unexpected error while calling GHN master data API.");
            return null;
        }
    }
}
