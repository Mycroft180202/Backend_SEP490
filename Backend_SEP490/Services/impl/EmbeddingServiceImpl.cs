using System.Text.Json;
using System.Net.Http.Json;
using AutoMapper;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;

public class EmbeddingServiceImpl : GenericServices, IEmbeddingService
{
    private readonly HttpClient _client;
    private readonly string _apiKey;
    private readonly Dictionary<string, double[]> _cache = new();

    public EmbeddingServiceImpl(IMapper mapper, IUnitOfWork unitOfWork, string apiKey)
        : base(mapper, unitOfWork)
    {
        _apiKey = apiKey ?? throw new ArgumentNullException(nameof(apiKey));
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
    }

    // Single embedding
    public async Task<double[]> GenerateEmbeddingAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return Array.Empty<double[]>().FirstOrDefault() ?? Array.Empty<double>();

        if (_cache.TryGetValue(text, out var cached))
            return cached;

        var body = new { model = "text-embedding-3-small", input = text };
        int maxRetries = 3;
        int delay = 1000;

        for (int attempt = 0; attempt <= maxRetries; attempt++)
        {
            var response = await _client.PostAsJsonAsync("https://api.openai.com/v1/embeddings", body);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadFromJsonAsync<JsonElement>();
                var data = json.GetProperty("data")[0].GetProperty("embedding");
                var embedding = data.EnumerateArray().Select(x => (double)x.GetDouble()).ToArray();
                _cache[text] = embedding;
                return embedding;
            }
            else if ((int)response.StatusCode == 429 && attempt < maxRetries)
            {
                await Task.Delay(delay);
                delay *= 2;
            }
            else
            {
                var content = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"OpenAI embedding API error ({response.StatusCode}): {content}");
            }
        }

        throw new Exception("Failed to generate embedding after retries.");
    }

    // Batch embedding
    public async Task<Dictionary<string, double[]>> GenerateEmbeddingBatchAsync(IEnumerable<string> texts)
    {
        var result = new Dictionary<string, double[]>();
        var textsList = texts.ToList();

        // Check cache first
        var textsToRequest = textsList.Where(t => !_cache.ContainsKey(t) && !string.IsNullOrWhiteSpace(t)).ToList();

        if (textsToRequest.Count > 0)
        {
            var body = new { model = "text-embedding-3-small", input = textsToRequest };
            int maxRetries = 3;
            int delay = 1000;

            for (int attempt = 0; attempt <= maxRetries; attempt++)
            {
                var response = await _client.PostAsJsonAsync("https://api.openai.com/v1/embeddings", body);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadFromJsonAsync<JsonElement>();
                    var dataArray = json.GetProperty("data").EnumerateArray().ToArray();

                    if (dataArray.Length != textsToRequest.Count)
                        throw new Exception("Mismatch between input texts and returned embeddings.");

                    for (int i = 0; i < textsToRequest.Count; i++)
                    {
                        var embedding = dataArray[i].GetProperty("embedding")
                                        .EnumerateArray().Select(x => (double)x.GetDouble()).ToArray();
                        _cache[textsToRequest[i]] = embedding;
                        result[textsToRequest[i]] = embedding;
                    }
                    break;
                }
                else if ((int)response.StatusCode == 429 && attempt < maxRetries)
                {
                    await Task.Delay(delay);
                    delay *= 2;
                }
                else
                {
                    var content = await response.Content.ReadAsStringAsync();
                    throw new HttpRequestException($"OpenAI embedding API error ({response.StatusCode}): {content}");
                }
            }
        }

        // Add cached embeddings
        foreach (var t in textsList)
        {
            if (_cache.TryGetValue(t, out var emb))
                result[t] = emb;
            else
                throw new Exception($"Missing embedding for text: '{t}'");
        }

        return result;
    }

    // Get cached embedding
    public double[]? GetCachedEmbedding(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        _cache.TryGetValue(text, out var emb);
        return emb;
    }
}
