namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOWeeklyRevenue
    {
        public int WeekNumber { get; set; } 
        public DateTime StartDate { get; set; } 
        public DateTime EndDate { get; set; } 
        public decimal TotalOrderNumber { get; set; }
        public decimal Revenue { get; set; }
    }
}
