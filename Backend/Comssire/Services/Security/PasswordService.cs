using Comssire.Models.Sistema;
using Microsoft.AspNetCore.Identity;

namespace Comssire.Services.Security
{
    /*
     * PasswordService
     * ---------------
     * Este servicio se encarga de:
     * 1) Generar un hash seguro a partir de una contraseña en texto (HashPassword)
     * 2) Verificar si una contraseña en texto coincide con un hash almacenado (VerifyPassword)
     *
     * Importante:
     * - No se guarda la contraseña real en la base de datos.
     * - Solo se guarda el resultado del hash en la columna Usuario.PasswordHash.
     *
     * Implementación:
     * - Usa PasswordHasher<Usuario> de Microsoft, recomendado en ASP.NET Core.
     */
    public interface IPasswordService
    {
        string HashPassword(Usuario user, string plainPassword);
        bool VerifyPassword(Usuario user, string plainPassword);
    }

    public class PasswordService : IPasswordService
    {
        private readonly PasswordHasher<Usuario> _hasher = new();

        /*
         * HashPassword
         * ------------
         * Recibe una contraseña en texto (plainPassword) y devuelve un hash seguro.
         * Ese hash es el que se guarda en la base de datos.
         */
        public string HashPassword(Usuario user, string plainPassword)
        {
            return _hasher.HashPassword(user, plainPassword);
        }

        /*
         * VerifyPassword
         * --------------
         * Compara una contraseña en texto contra el hash guardado.
         * Devuelve true si coincide, false si no coincide.
         */
        public bool VerifyPassword(Usuario user, string plainPassword)
        {
            var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, plainPassword);
            return result != PasswordVerificationResult.Failed;
        }
    }
}
