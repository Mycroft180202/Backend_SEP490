using System.Collections.Generic;
using System.Threading.Tasks;

public interface IEmbeddingService
{
    Task<double[]> GenerateEmbeddingAsync(string text);
    Task<Dictionary<string, double[]>> GenerateEmbeddingBatchAsync(IEnumerable<string> texts);
    double[]? GetCachedEmbedding(string text);
}