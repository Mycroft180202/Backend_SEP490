namespace Backend_SEP490.DTOs.Request;

public class ResponseDTOProductCollectionDetail
{
    public int ProductCollectionId { get; set; }
    
    public string Title { get; set; }
    public string Image { get; set; }
    public string? Headline { get; set; }

    public string? Content { get; set; }
    public DateTime CreatedDate { get; set; }
    
    public string? CreateName { get; set; }
    public ICollection<ResponseDTOProduct> Products { get; set; }
}