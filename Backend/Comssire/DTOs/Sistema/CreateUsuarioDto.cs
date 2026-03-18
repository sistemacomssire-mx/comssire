namespace Comssire.DTOs.Sistema
{
    /*
     * CreateUsuarioDto
     * ---------------
     * Datos que el administrador captura para dar de alta a un usuario.
     *
     * El sistema generará automáticamente:
     * - Username
     * - Contraseña temporal
     *
     * Por eso, este DTO NO incluye Username ni Password.
     */
    public class CreateUsuarioDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;

        // Opcional
        public string? Email { get; set; }

        // Opcional
        public DateOnly? FechaNacimiento { get; set; }

        /*
         * RolId:
         * - El usuario tendrá un solo rol.
         * - El rol define los permisos del usuario.
         */
        public int RolId { get; set; }
    }
}