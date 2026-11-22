using Aijentix.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Aijentix.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<AppUser, Microsoft.AspNetCore.Identity.IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<CompanyMembership> CompanyMemberships => Set<CompanyMembership>();
    public DbSet<Assessment> Assessments => Set<Assessment>();
    public DbSet<AssessmentHistory> AssessmentHistory => Set<AssessmentHistory>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<Company>().HasIndex(x => x.Name);
        b.Entity<CompanyMembership>().HasIndex(x => new { x.CompanyId, x.UserId }).IsUnique();
        b.Entity<CompanyMembership>().HasOne(x => x.Company).WithMany(x => x.Memberships).HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<CompanyMembership>().HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Assessment>().HasIndex(x => new { x.CompanyId, x.UpdatedAt });
        b.Entity<Assessment>().HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Assessment>().Property(x => x.Data).HasColumnType("jsonb");
        b.Entity<AssessmentHistory>().Property(x => x.Data).HasColumnType("jsonb");
        b.Entity<AssessmentHistory>().HasIndex(x => new { x.AssessmentId, x.Version }).IsUnique();
        b.Entity<AssessmentHistory>().HasOne(x => x.Assessment).WithMany(x => x.History).HasForeignKey(x => x.AssessmentId).OnDelete(DeleteBehavior.Cascade);
    }
}
