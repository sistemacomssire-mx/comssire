namespace Comssire.DTOs.Sistema
{
    /*
     * VerifyPasswordDto
     * -----------------
     * Se usa para probar que el PasswordHash funciona.
     * Envías el username y la contraseña en texto y el sistema responde true/false.
     *
     * Nota:
     * - Este endpoint solo es para pruebas en desarrollo.
     * - Cuando hagamos login con JWT, este endpoint ya no será necesario.
     */
    public class VerifyPasswordDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
