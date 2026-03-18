namespace Comssire.Models.Sistema
{
    /*
     * Representa a una persona que puede iniciar sesión en el sistema.
     * Un usuario pertenece a un solo rol.
     * El username y la contraseña se generan automáticamente al dar de alta.
     */
    public class Usuario
    {
        // Clave primaria
        public int Id { get; set; }

        // Datos personales capturados al registrar al usuario
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;

        // Opcional (por ahora). Si no lo capturas, puede quedar null.
        public string? Email { get; set; }

        // Opcional. Si no lo capturas, puede quedar null.
        public DateOnly? FechaNacimiento { get; set; }

        // Credenciales de acceso
        // Username se genera automáticamente y debe ser único
        public string Username { get; set; } = string.Empty;

        // Aquí se guarda el HASH de la contraseña, nunca la contraseña real
        public string PasswordHash { get; set; } = string.Empty;

        // Indica si el usuario puede iniciar sesión
        public bool Activo { get; set; } = true;

        // Indica si el usuario debe cambiar su contraseña al iniciar sesión
        public bool MustChangePassword { get; set; } = true;

        // Fecha de creación del usuario
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        // Relación: muchos usuarios pertenecen a un rol
        public int RolId { get; set; }
        public Rol Rol { get; set; } = null!;
    }
}