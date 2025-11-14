using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore.Storage;

namespace Backend_SEP490.Repositories.impl;

public class UnitOfWork: IUnitOfWork
{
    private readonly AppDbContext _context;
    
    public UnitOfWork(AppDbContext context,IProductRepositories product,IProductImagesRepositories productImages,IUserRepositories user,
        IFeedbackRepositories feedback,IOrderRepositories order,IRefreshTokenRepository refreshToken,ICategoryRepositories category, IBlogRepositories blog,
        IRoleRepository role, IUserRoleRepository userRole, IAddressRepositories address, IUserOtpRepositories userOtp, ICartRepositories cart,
        ICartItemRepositories cartItem, IWishListItemRepositories wishListItem,IProductCollectionRepositories productCollection, IVoucherRepositories voucher,
        IOrderDetailRepositories orderDetail, IShipmentRepositories shipment, INotificationRepository notification, IReportRepository report,
        IPaymentRepository payment, IProductShippingProfileRepository productShippingProfile)
    {
        _context = context;
        Products = product;
        ProductImages = productImages;
        Users = user;
        Feedback = feedback;
        Order = order;
        RefreshTokens = refreshToken;
        Categories = category;
        Blog = blog;
        Roles = role;
        UserRoles = userRole;
        Address = address; 
        UserOtps = userOtp;
        Cart = cart;
        CartItem = cartItem;
        WishListItem = wishListItem;
        ProductCollections = productCollection;
        Voucher = voucher;
        OrderDetail = orderDetail;
        Shipment = shipment;
        Notifications = notification;
        Reports = report;
        Payments = payment;
        ProductShippingProfiles = productShippingProfile;
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync()
    {
        return await _context.Database.BeginTransactionAsync();
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
    public IOrderRepositories Order { get; private set; }
    public IBlogRepositories Blog { get; private set; }
    public IRefreshTokenRepository RefreshTokens { get; }
    public ICategoryRepositories Categories { get; }
    public IRoleRepository Roles { get; }
    public IUserRoleRepository UserRoles { get; }
    public IAddressRepositories Address { get; }
    public IUserOtpRepositories UserOtps { get; }
    public ICartRepositories Cart { get; }
    public ICartItemRepositories CartItem { get; }
    public IWishListItemRepositories WishListItem { get; }
    public IProductCollectionRepositories ProductCollections { get; }
    public IVoucherRepositories Voucher { get; }
    public IOrderDetailRepositories OrderDetail { get; }
    public IShipmentRepositories Shipment { get; }
    public INotificationRepository Notifications { get; }
    public IReportRepository Reports { get; }
    public IPaymentRepository Payments { get; }
    public IProductShippingProfileRepository ProductShippingProfiles { get; }

}
