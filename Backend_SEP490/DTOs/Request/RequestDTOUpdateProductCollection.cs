public class RequestDTOUpdateProductCollection
{
    public int ProductCollectionId { get; set; }

    public string? Title { get; set; }
    public string? Headline { get; set; }
    public string? Content { get; set; }
    public string? Image { get; set; } 
    
    public List<string> ProductIds { get; set; } = new List<string>();
}