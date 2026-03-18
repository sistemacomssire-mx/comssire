namespace Comssire.Auth
{
    /*
     * JwtOptions
     * ----------
     * Representa la configuración JWT leída desde appsettings.json.
     *
     * Esta clase NO genera tokens.
     * Solo almacena la configuración necesaria para hacerlo.
     */
    public class JwtOptions
    {
        // Clave secreta para firmar el token
        public string Key { get; set; } = string.Empty;

        // Emisor del token (Issuer)
        public string Issuer { get; set; } = string.Empty;

        // Receptor del token (Audience)
        public string Audience { get; set; } = string.Empty;

        // Tiempo de expiración del token en minutos
        public int ExpiresMinutes { get; set; }
    }
}
