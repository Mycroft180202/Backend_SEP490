using System.Text.Json;
using AutoMapper;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class EmbeddingServiceImpl: GenericServices ,IEmbeddingService
{
    private readonly HttpClient _client;
    private readonly string _apiKey;
    public EmbeddingServiceImpl(IMapper mapper, IUnitOfWork unitOfWork, string apiKey)
        : base(mapper, unitOfWork)
    {
        _apiKey = apiKey ?? throw new ArgumentNullException(nameof(apiKey));
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
    }


    public async Task<float[]> GenerateEmbeddingAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return Array.Empty<float>();

        var body = new
        {
            model = "text-embedding-3-small",
            input = text
        };

        var response = await _client.PostAsJsonAsync("https://api.openai.com/v1/embeddings", body);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var data = json.GetProperty("data")[0].GetProperty("embedding");
        return data.EnumerateArray().Select(x => (float)x.GetDouble()).ToArray();
    }
}