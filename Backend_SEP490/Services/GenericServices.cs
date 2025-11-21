using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services;

public class GenericServices
{
    protected readonly IMapper _mapper;
    protected readonly IUnitOfWork _context;

    public GenericServices(IMapper mapper, IUnitOfWork unitOfWork)
    {
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _context = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    protected async Task ClearUserCartAsync(string? customerId)
    {
        if (string.IsNullOrWhiteSpace(customerId))
        {
            return;
        }

        var cart = await _context.Cart.GetCartByUserIdAsync(customerId);
        if (cart == null)
        {
            return;
        }

        if (cart.CartItems != null)
        {
            foreach (var item in cart.CartItems.ToList())
            {
                await _context.CartItem.DeleteCartItemAsync(item);
            }
        }

        await _context.Cart.DeleteCartAsync(cart);
    }
}
