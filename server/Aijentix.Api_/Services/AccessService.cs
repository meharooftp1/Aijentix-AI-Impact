using Aijentix.Api.Data;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace Aijentix.Api.Services;

public sealed class AccessService(AppDbContext db)
{
    public Guid UserId(ClaimsPrincipal user) => Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public bool IsPlatformAdmin(ClaimsPrincipal user) => user.IsInRole("PlatformAdmin");
    public async Task<bool> CanAccessCompany(ClaimsPrincipal user, Guid companyId)
    {
        if (IsPlatformAdmin(user)) return true;
        var userId = UserId(user);
        return await db.CompanyMemberships.AnyAsync(m => m.CompanyId == companyId && m.UserId == userId && m.User.IsActive && m.Company.IsActive);
    }
    public async Task<bool> HasCompanyRole(ClaimsPrincipal user, Guid companyId, params string[] roles)
    {
        if (IsPlatformAdmin(user)) return true;
        var userId = UserId(user);
        return await db.CompanyMemberships.AnyAsync(m => m.CompanyId == companyId && m.UserId == userId && roles.Contains(m.Role) && m.User.IsActive && m.Company.IsActive);
    }
}
