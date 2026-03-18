using Microsoft.AspNetCore.Authorization;

namespace Comssire.Auth
{
    /*
     * PermissionRequirement
     * ---------------------
     * Representa un requisito de autorización basado en un permiso.
     *
     * Ejemplo:
     * [Authorize(Policy = "compras.crear")]
     *
     * En este caso, la policyName = "compras.crear"
     * y se convierte en PermissionRequirement("compras.crear")
     */
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string Permission { get; }

        public PermissionRequirement(string permission)
        {
            Permission = permission;
        }
    }
}
