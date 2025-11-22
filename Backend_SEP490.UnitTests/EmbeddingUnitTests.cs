using AutoMapper;
using Backend_SEP490.Repositories;
using Moq;
using Moq.Protected;
using System.Net;

namespace Backend_SEP490.UnitTests
{
    public class EmbeddingUnitTests
    {
        private readonly Mock<HttpMessageHandler> _handlerMock;
        private readonly HttpClient _httpClient;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly EmbeddingServiceImpl _service;

        private const string ValidApiKey = "sk-test-123";

        public EmbeddingUnitTests()
        {
            _handlerMock = new Mock<HttpMessageHandler>();
            _httpClient = new HttpClient(_handlerMock.Object)
            {
                BaseAddress = new Uri("https://api.openai.com/")
            };

            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();

            _service = new EmbeddingServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object, ValidApiKey);
        }

        [Fact]
        public async Task GenerateEmbeddingAsync_EmptyText_ReturnsEmptyVector()
        {
            var result = await _service.GenerateEmbeddingAsync("   ");

            Assert.Empty(result);
        }


        [Fact]
        public void GetCachedEmbedding_NotExists_ReturnsNull()
        {
            var result = _service.GetCachedEmbedding("Non-existent text");

            Assert.Null(result);
        }

        private void SetupEmbeddingResponse(string inputText, double[] vector)
        {
            var jsonResponse = $$"""
                {
                    "data": [
                        {
                            "embedding": [{{string.Join(",", vector)}}]
                        }
                    ]
                }
                """;

            _handlerMock.Protected()
         .Setup<Task<HttpResponseMessage>>(
             "SendAsync",
             ItExpr.Is<HttpRequestMessage>(req =>
                 req.Method == HttpMethod.Post &&
                 req.RequestUri!.ToString().Contains("embeddings") &&
                 req.Headers.Authorization != null &&
                 req.Headers.Authorization.Scheme == "Bearer" &&
                 req.Headers.Authorization.Parameter == ValidApiKey
             ),
             ItExpr.IsAny<CancellationToken>())
         .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
         {
             Content = new StringContent(jsonResponse)
         });
        }

        private void SetupBatchResponse(IEnumerable<string> texts, Dictionary<string, double[]> vectors)
        {
            var dataArray = texts.Select(t =>
                $$"""
                {
                    "embedding": [{{string.Join(",", vectors[t])}}]
                }
                """);

            var jsonResponse = $$"""
                {
                    "data": [
                        {{string.Join(",", dataArray)}}
                    ]
                }
                """;

            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(jsonResponse)
                });
        }

        private HttpResponseMessage CreateSuccessResponse(double[] vector)
        {
            var json = $$"""
                {
                    "data": [
                        {
                            "embedding": [{{string.Join(",", vector)}}]
                        }
                    ]
                }
                """;

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json)
            };
        }
    }
}