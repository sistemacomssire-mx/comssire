namespace Comssire.DTOs.Sistema
{
    /*
     * CreateUsuarioResultDto
     * ---------------------
     * Respuesta que se devuelve al administrador
     * después de crear un usuario.
     *
     * Importante:
     * - TempPassword NO se guarda en la base de datos.
     * - Solo se devuelve en esta respuesta.
     */
    public class CreateUsuarioResultDto
    {
        // Id del usuario creado en la base de datos
        public int UsuarioId { get; set; }

        // Username generado automáticamente
        public string Username { get; set; } = string.Empty;

        // Contraseña temporal generada por el sistema
        public string TempPassword { get; set; } = string.Empty;

        // Datos para que el admin los vea en pantalla
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string? Email { get; set; }

        public int RolId { get; set; }
        public string RolNombre { get; set; } = string.Empty;
    }
}