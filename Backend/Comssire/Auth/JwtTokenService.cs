using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Comssire.Auth
{
    /*
     * JwtTokenService
     * ---------------
     * Servicio encargado de generar un JWT firmado.
     *
     * Entrada:
     * - userId: Id del usuario en BD
     * - username: nombre de usuario
     * - rolNombre: nombre del rol
     * - permisos: lista de permisos asociados al rol
     *
     * Salida:
     * - Token JWT (string)
     * - Fecha de expiración en UTC
     */
    public interface IJwtTokenService
    {
        (string token, DateTime expiresAtUtc) CreateToken(
            int userId,
            string username,
            string rolNombre,
            IEnumerable<string> permisos
        );
    }

    public class JwtTokenService : IJwtTokenService
    {
        private readonly JwtOptions _options;

        public JwtTokenService(IOptions<JwtOptions> options)
        {
            _options = options.Value;
        }

        public (string token, DateTime expiresAtUtc) CreateToken(
            int userId,
            string username,
            string rolNombre,
            IEnumerable<string> permisos
        )
        {
            var nowUtc = DateTime.UtcNow;
            var expiresAtUtc = nowUtc.AddMinutes(_options.ExpiresMinutes);

            /*
             * Claims básicos:
             * - sub: identificador del usuario (estándar JWT)
             * - nameidentifier: requerido por ASP.NET para User.Identity
             * - unique_name / name: username
             * - role: rol del usuario
             * - jti: id único del token
             */
            var claims = new List<Claim>
            {
                // Estándar JWT
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),

                // 🔥 IMPORTANTE: requerido para ClaimTypes.NameIdentifier
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),

                new Claim(JwtRegisteredClaimNames.UniqueName, username),
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, rolNombre),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            /*
             * Claims de permisos:
             * Se agrega un claim por cada permiso.
             */
            foreach (var permiso in permisos.Distinct())
            {
                claims.Add(new Claim(PermissionClaimTypes.Permission, permiso));
            }

            /*
             * Key y firma del token (HMAC SHA256).
             */
            var keyBytes = Encoding.UTF8.GetBytes(_options.Key);
            var signingKey = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            /*
             * Construcción del JWT.
             */
            var jwt = new JwtSecurityToken(
                issuer: _options.Issuer,
                audience: _options.Audience,
                claims: claims,
                notBefore: nowUtc,
                expires: expiresAtUtc,
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(jwt);

            return (tokenString, expiresAtUtc);
        }
    }
}
