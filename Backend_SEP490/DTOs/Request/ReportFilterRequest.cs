using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class ReportFilterRequest
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;

    public string? Status { get; set; }
    public string? SearchTerm { get; set; }

    [Range(1, int.MaxValue)]
    public int PageIndex { get; set; } = 1;

    public int PageSize
    {
        get => _pageSize;
        set
        {
            if (value <= 0)
            {
                return;
            }

            _pageSize = value > MaxPageSize ? MaxPageSize : value;
        }
    }
}
