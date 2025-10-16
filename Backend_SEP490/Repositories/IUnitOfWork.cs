namespace Backend_SEP490.Repositories;

public interface IUnitOfWork: IDisposable
{
    Task<int> CommitAsync();
    public Task<int> SaveChangesAsync();
    IProductRepositories Products { get; }
    IUserRepositories Users { get; }
    IFeedbackRepositories Feedback { get; }
    IProductImagesRepositories ProductImages { get; }
    IOrderRepositories Order { get; }
    IBlogRepositories Blog { get; }
    IRefreshTokenRepository RefreshTokens { get; }
    ICategoryRepositories Categories { get; }
}