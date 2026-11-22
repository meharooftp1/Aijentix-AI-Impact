namespace Aijentix.Api.Contracts;
public record LoginRequest(string Email, string Password);
public record CreateUserRequest(string Email, string FullName, string Password, string Role);
public record CreateCompanyRequest(string Name, string? Industry, string? Country);
public record AddMemberRequest(string Email, string Role);
public record SaveAssessmentRequest(string Title, string Status, System.Text.Json.JsonElement Data);
public record UpdateCompanyRequest(string Name, string? Industry, string? Country);
public record UpdateMemberRequest(string Role);
