using Aijentix.Api.Contracts;
using Aijentix.Api.Data;
using Aijentix.Api.Models;
using Aijentix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Aijentix.Api.Controllers;

[ApiController, Authorize, Route("api/companies/{companyId:guid}/assessments")]
public sealed class AssessmentsController(AppDbContext db, AccessService access) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid companyId)
    {
        if (!await access.CanAccessCompany(User, companyId)) return Forbid();
        return Ok(await db.Assessments.Where(a => a.CompanyId == companyId).OrderByDescending(a => a.UpdatedAt).Select(a => new { a.Id, a.Title, a.Status, a.Version, a.CreatedAt, a.UpdatedAt }).ToListAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid companyId, Guid id)
    {
        if (!await access.CanAccessCompany(User, companyId)) return Forbid();
        var a = await db.Assessments.SingleOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId);
        return a is null ? NotFound() : Ok(new { a.Id, a.CompanyId, a.Title, a.Status, a.Version, data = System.Text.Json.JsonDocument.Parse(a.Data).RootElement, a.CreatedAt, a.UpdatedAt });
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid companyId, SaveAssessmentRequest req)
    {
        if (!await access.HasCompanyRole(User, companyId, "CompanyAdmin", "Assessor")) return Forbid();
        var uid = access.UserId(User); var json = req.Data.GetRawText();
        var a = new Assessment { CompanyId = companyId, Title = req.Title, Status = req.Status, Data = json, CreatedById = uid, UpdatedById = uid };
        a.History.Add(new AssessmentHistory { Version = 1, Data = json, ChangedById = uid, ChangeType = "Created" });
        db.Assessments.Add(a); await db.SaveChangesAsync(); return CreatedAtAction(nameof(Get), new { companyId, id = a.Id }, new { a.Id, a.Version });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid companyId, Guid id, SaveAssessmentRequest req)
    {
        if (!await access.HasCompanyRole(User, companyId, "CompanyAdmin", "Assessor")) return Forbid();
        var a = await db.Assessments.SingleOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId);
        if (a is null) return NotFound();
        var uid = access.UserId(User); a.Version++; a.Title = req.Title; a.Status = req.Status; a.Data = req.Data.GetRawText(); a.UpdatedById = uid; a.UpdatedAt = DateTimeOffset.UtcNow;
        db.AssessmentHistory.Add(new AssessmentHistory { AssessmentId = a.Id, Version = a.Version, Data = a.Data, ChangedById = uid, ChangeType = "Updated" });
        await db.SaveChangesAsync(); return Ok(new { a.Id, a.Version, a.UpdatedAt });
    }

    [HttpGet("{id:guid}/history")]
    public async Task<IActionResult> History(Guid companyId, Guid id)
    {
        if (!await access.CanAccessCompany(User, companyId)) return Forbid();
        if (!await db.Assessments.AnyAsync(a => a.Id == id && a.CompanyId == companyId)) return NotFound();
        return Ok(await db.AssessmentHistory.Where(h => h.AssessmentId == id).OrderByDescending(h => h.Version).Select(h => new { h.Id, h.Version, h.ChangeType, h.ChangedById, h.ChangedAt }).ToListAsync());
    }

    [HttpGet("{id:guid}/history/{version:int}")]
    public async Task<IActionResult> GetVersion(Guid companyId, Guid id, int version)
    {
        if (!await access.CanAccessCompany(User, companyId)) return Forbid();
        var h = await db.AssessmentHistory.SingleOrDefaultAsync(h => h.AssessmentId == id && h.Assessment.CompanyId == companyId && h.Version == version);
        return h is null ? NotFound() : Ok(new { h.Version, data = System.Text.Json.JsonDocument.Parse(h.Data).RootElement, h.ChangedAt, h.ChangedById });
    }

    [HttpPost("{id:guid}/history/{version:int}/restore")]
    public async Task<IActionResult> RestoreVersion(Guid companyId, Guid id, int version)
    {
        if (!await access.HasCompanyRole(User, companyId, "CompanyAdmin", "Assessor")) return Forbid();
        var assessment = await db.Assessments.SingleOrDefaultAsync(a => a.Id == id && a.CompanyId == companyId);
        if (assessment is null) return NotFound();
        var historical = await db.AssessmentHistory.SingleOrDefaultAsync(h => h.AssessmentId == id && h.Version == version);
        if (historical is null) return NotFound();
        var uid = access.UserId(User);
        assessment.Version++;
        assessment.Data = historical.Data;
        assessment.UpdatedById = uid;
        assessment.UpdatedAt = DateTimeOffset.UtcNow;
        db.AssessmentHistory.Add(new AssessmentHistory { AssessmentId = id, Version = assessment.Version, Data = historical.Data, ChangedById = uid, ChangeType = $"Restored version {version}" });
        await db.SaveChangesAsync();
        return Ok(new { assessment.Id, assessment.Version, RestoredFromVersion = version, assessment.UpdatedAt });
    }
}
