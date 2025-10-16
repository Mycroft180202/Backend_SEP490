namespace Backend_SEP490.Services;

public interface IAuthServices
{
    public Task<string?> LoginAsyns(string username, string password);
}