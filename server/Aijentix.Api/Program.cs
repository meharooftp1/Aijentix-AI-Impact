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
builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));
builder.Services.AddIdentityCore<AppUser>(o => { o.Password.RequiredLength = 12; o.Password.RequireDigit = true; o.Password.RequireUppercase = true; o.Password.RequireLowercase = true; o.Password.RequireNonAlphanumeric = true; o.User.RequireUniqueEmail = true; })
    .AddRoles<IdentityRole<Guid>>().AddEntityFrameworkStores<AppDbContext>().AddSignInManager();
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Configure a strong Jwt:Key (at least 32 characters) using User Secrets or a production secret store.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => { o.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true, ValidIssuer = builder.Configuration["Jwt:Issuer"], ValidAudience = builder.Configuration["Jwt:Audience"], IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), ClockSkew = TimeSpan.FromMinutes(1) }; });
builder.Services.AddAuthorization(); builder.Services.AddScoped<AccessService>();
builder.Services.AddCors(o => o.AddPolicy("frontend", p => p.WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"]).AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseHttpsRedirection(); app.UseCors("frontend"); app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
using (var scope = app.Services.CreateScope())
{
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
