namespace Backend_SEP490.Repositories;

public interface IUnitOfWork: IDisposable
{
    Task<int> CommitAsync();
    public Task<int> SaveChangesAsync();
    IProductRepositories Products { get; }
    IUserRepositories Users { get; }
    IFeedbackRepositories Feedback { get; }
    IProductImagesRepositories ProductImages { get; }
    IRefreshTokenRepository RefreshTokens { get; }
    ICategoryRepositories Categories { get; }
    IRoleRepository Roles { get; }
    IUserRoleRepository UserRoles { get; }
    IUserOtpRepositories UserOtps { get; }
}