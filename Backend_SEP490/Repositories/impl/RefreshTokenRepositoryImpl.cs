using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class RefreshTokenRepositoryImpl: GenericRepositoryImpl<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepositoryImpl(AppDbContext context) : base(context)
    {
    }
    public async Task AddAsync(RefreshToken token)
    {
        await _context.RefreshTokens.AddAsync(token);
    }
    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        return await _context.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == token);
    }
}