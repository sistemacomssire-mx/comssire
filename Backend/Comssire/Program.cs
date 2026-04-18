using Comssire.Auth;
using Comssire.Data;
using Comssire.Services.Compras;
using Comssire.Services.ComprasRemision;
using Comssire.Services.Security;
using Comssire.Services.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

/*
 * QuestPDF:
 * Inicializar licencia global al arrancar la API para evitar
 * errores intermitentes al generar PDFs.
 */
QuestPDF.Settings.License = LicenseType.Community;

/*
 * Registro de servicios base (controllers).
 * IgnoreCycles para evitar 500 por ciclos en EF navigations
 */
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();

/*
 * CORS: permitir frontend (local + producción)
 * Configurable por appsettings / variables de entorno:
 *   Cors:AllowedOrigins = ["http://localhost:5173", "https://tuapp.netlify.app"]
 */
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        var origins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? Array.Empty<string>();

        if (origins.Length > 0)
        {
            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // Fallback solo para desarrollo si olvidaste configurar
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

/*
 * Swagger configurado para JWT
 */
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Comssire API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Escribe: Bearer {tu_token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

/*
 * Registro del DbContext (PostgreSQL)
 */
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

/*
 * Configuración JWT
 */
builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection("Jwt")
);

/*
 * Servicios de seguridad
 */
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

/*
 * Autenticación JWT (Bearer)
 */
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSection = builder.Configuration.GetSection("Jwt");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSection["Key"]!)
            ),

            ClockSkew = TimeSpan.Zero
        };
    });

/*
 * Autorización
 */
builder.Services.AddAuthorization();

/*
 * Autorización por permisos (policies dinámicas)
 */
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

/*
 * Servicios de Compras / PDF
 */
builder.Services.AddScoped<CompraPdfService>();
builder.Services.AddScoped<CompraRemisionPdfService>();

/*
 * Storage (Railway Bucket / S3-compatible)
 */
builder.Services.Configure<StorageOptions>(builder.Configuration.GetSection("Storage"));
builder.Services.AddScoped<IStorageService, S3StorageService>();

var app = builder.Build();

/*
 * Swagger solo en Development
 */
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

/*
 * Middlewares básicos
 */
app.UseHttpsRedirection();
app.UseCors("AllowReact");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

/*
 * Seed automático
 */
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordService>();

    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db, passwordService);
}

app.Run();
