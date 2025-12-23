using System.Net.Http.Headers;

namespace Backend_SEP490.SystemTests.Support;

public static class TestMedia
{
    // Minimal 1x1 transparent PNG
    private const string TinyPngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

    public static StreamContent CreateTinyImage()
    {
        var bytes = Convert.FromBase64String(TinyPngBase64);
        var stream = new MemoryStream(bytes);
        var content = new StreamContent(stream);
        content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        return content;
    }
}
