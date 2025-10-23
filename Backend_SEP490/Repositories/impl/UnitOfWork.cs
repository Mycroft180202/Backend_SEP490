using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories.impl;

public class UnitOfWork: IUnitOfWork
{
    private readonly AppDbContext _context;
    public UnitOfWork(AppDbContext context,IProductRepositories product,IProductImagesRepositories productImages,IUserRepositories user,
        IFeedbackRepositories feedback,IRefreshTokenRepository refreshToken,ICategoryRepositories category,IRoleRepository role,
        IUserRoleRepository userRole, IUserOtpRepositories userOtp,IProductCollectionRepositories productCollection)
    {
        _context = context;
        Products = product;
        ProductImages = productImages;
        Users = user;
        Feedback = feedback;
        RefreshTokens = refreshToken;
        Categories = category;
        Roles = role;
        UserRoles = userRole;
        UserOtps = userOtp;
        ProductCollections = productCollection;
        
    }
    public void Dispose()
    {
        _context.DisposeAsync();
    }

    public async Task<int> CommitAsync()
    {
        return await _context.SaveChangesAsync();
    }
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
    public IProductRepositories Products { get;private set;  }
    public IUserRepositories Users { get;private set;  }
    public IFeedbackRepositories Feedback { get;private set;  }
    public IProductImagesRepositories ProductImages { get;private set;  }
    public IRefreshTokenRepository RefreshTokens { get; }
    public ICategoryRepositories Categories { get; }
    public IRoleRepository Roles { get; }
    public IUserRoleRepository UserRoles { get; }
    public IUserOtpRepositories UserOtps { get; }
    public IProductCollectionRepositories ProductCollections { get; }
    
}