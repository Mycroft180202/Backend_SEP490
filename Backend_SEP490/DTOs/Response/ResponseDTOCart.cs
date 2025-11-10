using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOCart
    {
        public DateTime? CreateAt { get; set; }
        public ResponseDTOUser Customer { get; set; }
        public PagedResult<ResponseDTOCartItem>? CartItems { get; set; }
    }
}
