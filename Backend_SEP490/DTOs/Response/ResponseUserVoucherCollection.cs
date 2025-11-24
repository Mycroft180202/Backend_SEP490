using System.Collections.Generic;
using System.Linq;

namespace Backend_SEP490.DTOs.Response;

public class ResponseUserVoucherCollection
{
    public IEnumerable<ResponseDTOVoucher> Shared { get; set; } = Enumerable.Empty<ResponseDTOVoucher>();
    public IEnumerable<ResponseDTOVoucher> Personal { get; set; } = Enumerable.Empty<ResponseDTOVoucher>();
}
