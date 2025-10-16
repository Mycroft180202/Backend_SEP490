namespace Backend_SEP490.DTOs.Request;

public class ResponseDTOAuth
{
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
    public DateTime ExpireAt { get; set; }
}