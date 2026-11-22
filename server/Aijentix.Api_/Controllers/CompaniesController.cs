using Aijentix.Api.Contracts;
using Aijentix.Api.Data;
using Aijentix.Api.Models;
using Aijentix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Aijentix.Api.Controllers;

[ApiController, Authorize, Route("api/companies")]
public sealed class CompaniesController(AppDbContext db, AccessService access, UserManager<AppUser> users) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool includeInactive = false)
    {
        if (includeInactive && !access.IsPlatformAdmin(User)) return Forbid();
        if (access.IsPlatformAdmin(User))
            return Ok(await db.Companies.Where(c => includeInactive || c.IsActive).OrderBy(c => c.Name)
                .Select(c => new { c.Id, c.Name, c.Industry, c.Country, c.IsActive, c.CreatedAt }).ToListAsync());
        var uid = access.UserId(User);
        return Ok(await db.CompanyMemberships.Where(m => m.UserId == uid && m.Company.IsActive)
            .Select(m => new { m.Company.Id, m.Company.Name, m.Company.Industry, m.Company.Country, m.Company.IsActive, m.Role }).ToListAsync());
    }

    [HttpPost, Authorize(Roles = "PlatformAdmin")]
    public async Task<IActionResult> Create(CreateCompanyRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Company name is required.");
        var c = new Company { Name = req.Name.Trim(), Industry = req.Industry, Country = req.Country };
        db.Companies.Add(c); await db.SaveChangesAsync();
        return CreatedAtAction(nameof(List), new { id = c.Id }, new { c.Id, c.Name, c.Industry, c.Country, c.IsActive, c.CreatedAt });
    }

    [HttpPut("{companyId:guid}"), Authorize(Roles = "PlatformAdmin")]
    public async Task<IActionResult> Update(Guid companyId, UpdateCompanyRequest req)
    {
        var c = await db.Companies.FindAsync(companyId);
        if (c is null) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Company name is required.");
        c.Name = req.Name.Trim(); c.Industry = req.Industry; c.Country = req.Country;
        await db.SaveChangesAsync();
        return Ok(new { c.Id, c.Name, c.Industry, c.Country, c.IsActive, c.CreatedAt });
    }

    [HttpDelete("{companyId:guid}"), Authorize(Roles = "PlatformAdmin")]
    public async Task<IActionResult> Deactivate(Guid companyId)
    {
        var c = await db.Companies.FindAsync(companyId);
        if (c is null) return NotFound();
        c.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{companyId:guid}/members")]
    public async Task<IActionResult> AddMember(Guid companyId, AddMemberRequest req)
    {
        if (!await access.HasCompanyRole(User, companyId, "CompanyAdmin")) return Forbid();
        var user = await users.FindByEmailAsync(req.Email);
        if (user is null) return NotFound(new { message = "Create the user account first, then add them to this company." });
        var role = req.Role is "CompanyAdmin" or "Assessor" or "Viewer" ? req.Role : "Assessor";
        if (await db.CompanyMemberships.AnyAsync(m => m.CompanyId == companyId && m.UserId == user.Id)) return Conflict("User is already a member of this company.");
        db.CompanyMemberships.Add(new CompanyMembership { CompanyId = companyId, UserId = user.Id, Role = role });
        await db.SaveChangesAsync(); return Ok();
    }

    [HttpGet("{companyId:guid}/members")]
    public async Task<IActionResult> Members(Guid companyId)
    {
        if (!await access.HasCompanyRole(User, companyId, "CompanyAdmin")) return Forbid();
        return Ok(await db.CompanyMemberships.Where(m => m.CompanyId == companyId)
            .Select(m => new { m.UserId, m.User.Email, m.User.FullName, m.Role, m.User.IsActive }).ToListAsync());
    }

    [HttpPut("{companyId:guid}/members/{userId:guid}")]
    public async Task<IActionResult> UpdateMember(Guid companyId, Guid userId, UpdateMemberRequest req)
    {
        if (!await access.HasCompanyRole(User, companyId, "CompanyAdmin")) return Forbid();
        if (req.Role is not ("CompanyAdmin" or "Assessor" or "Viewer")) return BadRequest("Invalid company role.");
        var member = await db.CompanyMemberships.SingleOrDefaultAsync(m => m.CompanyId == companyId && m.UserId == userId);
        if (member is null) return NotFound();
        member.Role = req.Role; await db.SaveChangesAsync(); return NoContent();
    }

    [HttpDelete("{companyId:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid companyId, Guid userId)
    {
        if (!await access.HasCompanyRole(User, companyId, "CompanyAdmin")) return Forbid();
        var member = await db.CompanyMemberships.SingleOrDefaultAsync(m => m.CompanyId == companyId && m.UserId == userId);
        if (member is null) return NotFound();
        db.CompanyMemberships.Remove(member); await db.SaveChangesAsync(); return NoContent();
    }

    [HttpPost("{companyId:guid}/users"), Authorize(Roles = "PlatformAdmin")]
    public async Task<IActionResult> CreateUser(Guid companyId, CreateUserRequest req)
    {
        if (!await db.Companies.AnyAsync(c => c.Id == companyId && c.IsActive)) return NotFound();
        var user = new AppUser { UserName = req.Email, Email = req.Email, FullName = req.FullName, EmailConfirmed = true };
        var result = await users.CreateAsync(user, req.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);
        var role = req.Role is "CompanyAdmin" or "Assessor" or "Viewer" ? req.Role : "Assessor";
        db.CompanyMemberships.Add(new CompanyMembership { CompanyId = companyId, UserId = user.Id, Role = role });
        await db.SaveChangesAsync(); return Ok(new { user.Id, user.Email, user.FullName, Role = role });
    }
}
