namespace Backend_SEP490.DTOs.Request;

public class RequestDTOProduct
{
    public int ProductID { get; set; }
    public string ProductName { get; set; }
    public string ProductDescription { get; set; }
    public decimal ProductPrice { get; set; }
    public string ProductImage { get; set; }
    public int ProductStock { get; set; }
    public int ProductCategoryID { get; set; }
}