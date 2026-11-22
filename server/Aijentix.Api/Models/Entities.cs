using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace Aijentix.Api.Models;

public sealed class AppUser : IdentityUser<Guid>
{
    [MaxLength(160)] public string FullName { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Company
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [MaxLength(180)] public string Name { get; set; } = "";
    [MaxLength(120)] public string? Industry { get; set; }
    [MaxLength(80)] public string? Country { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<CompanyMembership> Memberships { get; set; } = new List<CompanyMembership>();
}

public sealed class CompanyMembership
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    [MaxLength(32)] public string Role { get; set; } = "Assessor";
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Assessment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    [MaxLength(180)] public string Title { get; set; } = "AI Capability Assessment";
    [MaxLength(32)] public string Status { get; set; } = "InProgress";
    public string Data { get; set; } = "{}";
    public int Version { get; set; } = 1;
    public Guid CreatedById { get; set; }
    public Guid UpdatedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<AssessmentHistory> History { get; set; } = new List<AssessmentHistory>();
}

public sealed class AssessmentHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AssessmentId { get; set; }
    public Assessment Assessment { get; set; } = null!;
    public int Version { get; set; }
    public string Data { get; set; } = "{}";
    [MaxLength(80)] public string ChangeType { get; set; } = "Updated";
    public Guid ChangedById { get; set; }
    public DateTimeOffset ChangedAt { get; set; } = DateTimeOffset.UtcNow;
}
