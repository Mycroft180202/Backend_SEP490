namespace Backend_SEP490.Repositories;

public interface IUnitOfWork: IDisposable
{
    Task<int> CommitAsync();
    IProductRepositories Products { get; }    
}