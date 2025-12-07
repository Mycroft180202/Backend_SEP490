namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOMonthRevenuePercentage
    {
        public string CategoryId { get; set; }
        public string CategoryName { get; set; }
        public decimal Revenue { get; set; }
        public decimal Percentage { get; set; }
    }
}
