using System.Security.Claims;

namespace Backend_SEP490.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string? GetUserId(this ClaimsPrincipal? user)
    {
        if (user == null)
        {
            return null;
        }

        return user.FindFirstValue("userId") ?? user.FindFirstValue("userID");
    }
}
