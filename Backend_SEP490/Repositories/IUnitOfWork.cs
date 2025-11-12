using Microsoft.EntityFrameworkCore.Storage;

namespace Backend_SEP490.Repositories;

public interface IUnitOfWork: IDisposable
{
    Task<int> CommitAsync();
    public Task<int> SaveChangesAsync();

    Task<IDbContextTransaction> BeginTransactionAsync();
    IProductRepositories Products { get; }
    IUserRepositories Users { get; }
    IFeedbackRepositories Feedback { get; }
    IProductImagesRepositories ProductImages { get; }
    IOrderRepositories Order { get; }
    IBlogRepositories Blog { get; }
    IRefreshTokenRepository RefreshTokens { get; }
    ICategoryRepositories Categories { get; }
    IRoleRepository Roles { get; }
    IUserRoleRepository UserRoles { get; }
    IAddressRepositories Address { get; }
    IUserOtpRepositories UserOtps { get; }
    ICartRepositories Cart { get; }
    ICartItemRepositories CartItem { get; }
    IWishListItemRepositories WishListItem { get; }
    IProductCollectionRepositories ProductCollections { get; }
    IVoucherRepositories Voucher { get; }
    IOrderDetailRepositories OrderDetail { get; }
    IShipmentRepositories Shipment { get; }
    INotificationRepository Notifications { get; }
    IReportRepository Reports { get; }
    IPaymentRepository Payments { get; }

}
