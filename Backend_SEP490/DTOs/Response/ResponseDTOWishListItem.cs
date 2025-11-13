using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOWishListItem
    {
        public string Id { get; set; }
        public string UserID { get; set; }
        public DateTime AddAt { get; set; }
        public ResponseDTOProduct? Product { get; set; }

    }
}
