using System.Security.Claims;
using Comssire.Auth;
using Comssire.Data;
using Comssire.DTOs.Auth;
using Comssire.DTOs.Sistema;
using Comssire.Services.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Comssire.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IPasswordService _passwordService;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthController(
            AppDbContext db,
            IPasswordService passwordService,
            IJwtTokenService jwtTokenService)
        {
            _db = db;
            _passwordService = passwordService;
            _jwtTokenService = jwtTokenService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Username y Password son requeridos.");

            var user = await _db.Usuarios
                .Include(u => u.Rol)
                    .ThenInclude(r => r.RolesPermisos)
                        .ThenInclude(rp => rp.Permiso)
                .FirstOrDefaultAsync(u => u.Username == dto.Username);

            if (user == null || !user.Activo)
                return Unauthorized("Credenciales inválidas.");

            var ok = _passwordService.VerifyPassword(user, dto.Password);
            if (!ok)
                return Unauthorized("Credenciales inválidas.");

            var rolNombre = user.Rol?.Nombre ?? "SinRol";
            var permisos = user.Rol?.RolesPermisos
                .Select(rp => rp.Permiso.Clave)
                .Distinct()
                .ToList() ?? new List<string>();

            var (token, expiresAtUtc) = _jwtTokenService.CreateToken(
                userId: user.Id,
                username: user.Username,
                rolNombre: rolNombre,
                permisos: permisos
            );

            return Ok(new LoginResponseDto
            {
                Token = token,
                ExpiresAtUtc = expiresAtUtc,
                Username = user.Username,
                Rol = rolNombre,
                Permisos = permisos,
                MustChangePassword = user.MustChangePassword // ✅ NUEVO
            });
        }

        // ✅ Útil para React: trae info del usuario desde el token
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var user = await _db.Usuarios
                .Include(u => u.Rol)
                    .ThenInclude(r => r.RolesPermisos)
                        .ThenInclude(rp => rp.Permiso)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || !user.Activo)
                return Unauthorized();

            var rolNombre = user.Rol?.Nombre ?? "SinRol";
            var permisos = user.Rol?.RolesPermisos
                .Select(rp => rp.Permiso.Clave)
                .Distinct()
                .ToList() ?? new List<string>();

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Nombre,
                user.Apellidos,
                Rol = rolNombre,
                Permisos = permisos,
                user.MustChangePassword,
                user.Activo
            });
        }

        // ✅ Usuario cambia su contraseña (requiere contraseña actual)
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangeMyPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest("CurrentPassword y NewPassword son requeridos.");

            if (dto.NewPassword.Length < 8)
                return BadRequest("La nueva contraseña debe tener al menos 8 caracteres.");

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var user = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || !user.Activo)
                return Unauthorized("Usuario inválido o inactivo.");

            var ok = _passwordService.VerifyPassword(user, dto.CurrentPassword);
            if (!ok)
                return BadRequest("La contraseña actual no es correcta.");

            user.PasswordHash = _passwordService.HashPassword(user, dto.NewPassword);
            user.MustChangePassword = false;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Contraseña actualizada correctamente." });
        }
    }
}
