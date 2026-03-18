namespace Comssire.DTOs.Sistema
{
    public class UsuarioListItemDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;

        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;

        public string? Email { get; set; }

        public bool Activo { get; set; }
        public bool MustChangePassword { get; set; }

        public int RolId { get; set; }
        public string RolNombre { get; set; } = string.Empty;
    }
}