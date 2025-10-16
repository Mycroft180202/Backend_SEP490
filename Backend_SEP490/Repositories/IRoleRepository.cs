using Backend_SEP490.Models;

public interface IRoleRepository
{
    Task<Role?> GetByNameAsync(string roleName);
    
}