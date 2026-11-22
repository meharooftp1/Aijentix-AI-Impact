# Vercel Container runtime: builds this file and routes all traffic to the image.
# Docs: https://vercel.com/docs/functions/runtimes/container

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first so the NuGet layer is cached across source-only changes.
COPY Aijentix.Api.csproj ./
RUN dotnet restore Aijentix.Api.csproj

COPY . ./
RUN dotnet publish Aijentix.Api.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Port 80 is Vercel's default, but that needs root. Listen on 8080 and set
# PORT=8080 in the Vercel project so the platform routes to it.
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_EnableDiagnostics=0 \
    DOTNET_RUNNING_IN_CONTAINER=true

COPY --from=build /app/publish ./

# The .NET 8 images ship a non-root "app" user.
USER app
EXPOSE 8080

ENTRYPOINT ["dotnet", "Aijentix.Api.dll"]
