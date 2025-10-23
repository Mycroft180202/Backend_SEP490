namespace Backend_SEP490.DTOs.Request;

public class RequestDTOCreateProductCollection
{
    public string Title { get; set; }
    public string? Headline { get; set; }
    public string? Content { get; set; }

    public IFormFile? ImageFile { get; set; }

    
    public List<string>? ProductIds { get; set; }

    public string? CreatedById { get; set; }
}