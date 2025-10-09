namespace Backend_SEP490.Repositories;

public interface IUnitOfWork: IDisposable
{
    Task<int> CommitAsync();
    IProductRepositories Products { get; }
    IUserRepositories Users { get; }
    IFeedbackRepositories Feedback { get; }
    IProductImagesRepositories ProductImages { get; }
}