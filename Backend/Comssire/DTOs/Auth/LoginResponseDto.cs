namespace Comssire.DTOs.Auth
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }

        public string Username { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;

        public List<string> Permisos { get; set; } = new();

        // ✅ NUEVO: para forzar cambio en frontend
        public bool MustChangePassword { get; set; }
    }
}
