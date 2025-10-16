using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

public interface IUserRoleRepository
{
    Task AddUserRoleAsync(UserRole userRole);
}