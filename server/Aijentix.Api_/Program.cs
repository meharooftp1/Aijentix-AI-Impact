using Aijentix.Api.Data;
using Aijentix.Api.Models;
using Aijentix.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
var connectionString = builder.Configuration.GetConnectionString("Postgres");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Configure ConnectionStrings:Postgres (env var ConnectionStrings__Postgres) before starting the API.");
builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString));
builder.Services.AddIdentityCore<AppUser>(o => { o.Password.RequiredLength = 12; o.Password.RequireDigit = true; o.Password.RequireUppercase = true; o.Password.RequireLowercase = true; o.Password.RequireNonAlphanumeric = true; o.User.RequireUniqueEmail = true; })
    .AddRoles<IdentityRole<Guid>>().AddEntityFrameworkStores<AppDbContext>().AddSignInManager();
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Configure a strong Jwt:Key (at least 32 characters) using User Secrets or a production secret store.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => { o.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true, ValidIssuer = builder.Configuration["Jwt:Issuer"], ValidAudience = builder.Configuration["Jwt:Audience"], IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), ClockSkew = TimeSpan.FromMinutes(1) }; });
builder.Services.AddAuthorization(); builder.Services.AddScoped<AccessService>();
builder.Services.AddCors(o => o.AddPolicy("frontend", p => p.WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"]).SetIsOriginAllowedToAllowWildcardSubdomains().AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
// Vercel (and most container hosts) terminate TLS at the edge and forward plain HTTP.
if (app.Environment.IsDevelopment()) app.UseHttpsRedirection();
app.UseCors("frontend"); app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
app.MapGet("/", () => Results.Ok(new { service = "Aijentix.Api", status = "ok" }));
app.MapGet("/health", () => Results.Ok(new { status = "ok", utc = DateTimeOffset.UtcNow }));
// Schema creation + role/admin seeding. Set Bootstrap__Enabled=false once the database is provisioned.
if (builder.Configuration.GetValue("Bootstrap:Enabled", true))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>(); await db.Database.EnsureCreatedAsync();
    var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    foreach (var role in new[] { "PlatformAdmin", "CompanyAdmin", "Assessor", "Viewer" }) if (!await roles.RoleExistsAsync(role)) await roles.CreateAsync(new IdentityRole<Guid>(role));
    var manager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var email = app.Configuration["BootstrapAdmin:Email"] ?? app.Configuration["AdminSeed:Email"];
    var password = app.Configuration["BootstrapAdmin:Password"] ?? app.Configuration["AdminSeed:Password"];
    if (!string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(password) && await manager.FindByEmailAsync(email) is null)
    {
        var admin = new AppUser { UserName = email, Email = email, FullName = "Aijentix Platform Administrator", EmailConfirmed = true };
        var result = await manager.CreateAsync(admin, password); if (!result.Succeeded) throw new Exception(string.Join("; ", result.Errors.Select(e => e.Description)));
        await manager.AddToRoleAsync(admin, "PlatformAdmin");
    }
}
app.Run();
