namespace Comssire.DTOs.Auth
{
    /*
     * LoginRequestDto
     * ---------------
     * Datos que el cliente envía para iniciar sesión.
     *
     * Username:
     * - Es el identificador que generamos al crear el usuario.
     *
     * Password:
     * - Es la contraseña en texto plano que escribe el usuario.
     * - Se comparará contra PasswordHash usando IPasswordService.
     */
    public class LoginRequestDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
