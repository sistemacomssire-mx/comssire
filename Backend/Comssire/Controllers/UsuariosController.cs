using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Comssire.Data;
using Comssire.DTOs.Sistema;
using Comssire.Models.Sistema;
using Comssire.Services.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Comssire.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IPasswordService _passwordService;

        public UsuariosController(AppDbContext db, IPasswordService passwordService)
        {
            _db = db;
            _passwordService = passwordService;
        }

        // =========================================================
        // ADMIN: LISTAR USUARIOS
        // =========================================================
        [Authorize(Policy = "usuarios.ver")]
        [HttpGet]
        public async Task<ActionResult<List<UsuarioListItemDto>>> GetAll()
        {
            var users = await _db.Usuarios
                .AsNoTracking()
                .Include(u => u.Rol)
                .OrderByDescending(u => u.Id)
                .Select(u => new UsuarioListItemDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Nombre = u.Nombre,
                    Apellidos = u.Apellidos,
                    Email = u.Email,

                    Activo = u.Activo,
                    MustChangePassword = u.MustChangePassword,
                    RolId = u.RolId,
                    RolNombre = u.Rol.Nombre
                })
                .ToListAsync();

            return Ok(users);
        }

        // =========================================================
        // ADMIN: CREAR USUARIO
        // =========================================================
        [Authorize(Policy = "usuarios.crear")]
        [HttpPost]
        public async Task<ActionResult<CreateUsuarioResultDto>> Crear([FromBody] CreateUsuarioDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Apellidos))
                return BadRequest("Nombre y apellidos son requeridos.");

            if (!string.IsNullOrWhiteSpace(dto.Email) && !IsValidEmail(dto.Email))
                return BadRequest("Email no es válido.");

            var rol = await _db.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == dto.RolId);
            if (rol == null)
                return BadRequest("RolId no existe.");

            var usernameBase = BuildUsernameBase(dto.Nombre, dto.Apellidos);
            var usernameFinal = await MakeUniqueUsernameAsync(usernameBase);

            var tempPassword = GenerateTempPassword(12);

            var user = new Usuario
            {
                Nombre = dto.Nombre.Trim(),
                Apellidos = dto.Apellidos.Trim(),
                Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
                FechaNacimiento = dto.FechaNacimiento,

                Username = usernameFinal,
                RolId = dto.RolId,
                Activo = true,
                MustChangePassword = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            user.PasswordHash = _passwordService.HashPassword(user, tempPassword);

            _db.Usuarios.Add(user);
            await _db.SaveChangesAsync();

            return Ok(new CreateUsuarioResultDto
            {
                UsuarioId = user.Id,
                Username = user.Username,
                TempPassword = tempPassword,

                Nombre = user.Nombre,
                Apellidos = user.Apellidos,
                Email = user.Email,

                RolId = user.RolId,
                RolNombre = rol.Nombre
            });
        }

        // =========================================================
        // ADMIN: ASIGNAR ROL
        // =========================================================
        [Authorize(Policy = "usuarios.asignar_rol")]
        [HttpPut("{id:int}/rol")]
        public async Task<IActionResult> UpdateRol(int id, [FromBody] UpdateUsuarioRolDto dto)
        {
            var rolExiste = await _db.Roles.AnyAsync(r => r.Id == dto.RolId);
            if (!rolExiste)
                return BadRequest("RolId no existe.");

            var user = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound("Usuario no existe.");

            user.RolId = dto.RolId;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Rol actualizado." });
        }

        // =========================================================
        // ADMIN: ACTIVAR/DESACTIVAR
        // =========================================================
        [Authorize(Policy = "usuarios.editar")]
        [HttpPut("{id:int}/activo")]
        public async Task<IActionResult> SetActivo(int id, [FromBody] SetActivoDto dto)
        {
            var user = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound("Usuario no existe.");

            user.Activo = dto.Activo;
            await _db.SaveChangesAsync();

            return Ok(new { message = dto.Activo ? "Usuario activado." : "Usuario desactivado." });
        }

        // =========================================================
        // ADMIN: RESET PASSWORD (SIN PEDIR PASSWORD ANTERIOR)
        // =========================================================
        [Authorize(Policy = "usuarios.reset_password")]
        [HttpPost("{id:int}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] AdminResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest("NewPassword es requerido.");

            if (dto.NewPassword.Length < 8)
                return BadRequest("La nueva contraseña debe tener al menos 8 caracteres.");

            var user = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound("Usuario no existe.");

            user.PasswordHash = _passwordService.HashPassword(user, dto.NewPassword);

            // ✅ CLAVE: por reset de admin NO queremos forzar cambio otra vez
            user.MustChangePassword = dto.MustChangePassword; // por defecto viene false

            await _db.SaveChangesAsync();
            return Ok(new { message = "Contraseña actualizada correctamente." });
        }
        // =========================================================
        // TEST: VALIDAR JWT / PERMISOS
        // =========================================================
        [Authorize]
        [HttpGet("protegido")]
        public IActionResult Protegido()
        {
            return Ok(new
            {
                mensaje = "JWT válido. Acceso permitido.",
                usuario = User.Identity?.Name,
                rol = User.FindFirst(ClaimTypes.Role)?.Value
            });
        }

        [Authorize(Policy = "dashboard.ver")]
        [HttpGet("dashboard-test")]
        public IActionResult DashboardTest()
        {
            return Ok(new
            {
                mensaje = "Tienes permiso dashboard.ver",
                usuario = User.Identity?.Name
            });
        }

        // =========================================================
        // SOLO DESARROLLO
        // =========================================================
        [AllowAnonymous]
        [HttpPost("verify-password")]
        public async Task<ActionResult<bool>> VerifyPassword([FromBody] VerifyPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Username y Password son requeridos.");

            var user = await _db.Usuarios.FirstOrDefaultAsync(u => u.Username == dto.Username);
            if (user == null)
                return NotFound("Usuario no existe.");

            var ok = _passwordService.VerifyPassword(user, dto.Password);
            return Ok(ok);
        }

        // =========================================================
        // Helpers
        // =========================================================
        private static bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return string.Equals(addr.Address, email.Trim(), StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        private static string BuildUsernameBase(string nombre, string apellidos)
        {
            var firstName = nombre.Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)[0];

            var lastName = apellidos.Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)[0];

            var raw = (firstName + "." + lastName).ToLowerInvariant();
            raw = RemoveDiacritics(raw);
            raw = Regex.Replace(raw, @"[^a-z0-9\.]", "");

            return raw;
        }

        private async Task<string> MakeUniqueUsernameAsync(string baseUsername)
        {
            var candidate = baseUsername;
            var n = 1;

            while (await _db.Usuarios.AnyAsync(u => u.Username == candidate))
            {
                n++;
                candidate = $"{baseUsername}{n}";
            }

            return candidate;
        }

        private static string GenerateTempPassword(int length)
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$?_";
            var rnd = new Random();
            var sb = new StringBuilder();
            for (var i = 0; i < length; i++)
                sb.Append(chars[rnd.Next(chars.Length)]);
            return sb.ToString();
        }

        private static string RemoveDiacritics(string text)
        {
            var normalized = text.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();

            foreach (var c in normalized)
            {
                var uc = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
                if (uc != System.Globalization.UnicodeCategory.NonSpacingMark)
                    sb.Append(c);
            }

            return sb.ToString().Normalize(NormalizationForm.FormC);
        }
    }
}