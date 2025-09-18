using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories.impl;

public class UnitOfWork: IUnitOfWork
{
    private readonly AppDbContext _context;
    public UnitOfWork(AppDbContext context,IProductRepositories product)
    {
        _context = context;
        Products = product;
    }
    public void Dispose()
    {
        _context.DisposeAsync();
    }

    public async Task<int> CommitAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public IProductRepositories Products { get;private set;  }
}