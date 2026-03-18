using Microsoft.AspNetCore.Authorization;

namespace Comssire.Auth
{
    /*
     * PermissionHandler
     * -----------------
     * Este handler se ejecuta cuando un endpoint tiene:
     * [Authorize(Policy = "algún_permiso")]
     *
     * Se considera autorizado si el token JWT contiene un claim:
     * - Type  = PermissionClaimTypes.Permission   (por ejemplo "permission")
     * - Value = el permiso requerido (por ejemplo "compras.crear")
     */
    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            /*
             * Si el usuario no está autenticado, no se autoriza.
             */
            if (context.User?.Identity?.IsAuthenticated != true)
                return Task.CompletedTask;

            /*
             * Verifica si existe el permiso requerido dentro de los claims del JWT.
             */
            var hasPermission = context.User.Claims.Any(c =>
                c.Type == PermissionClaimTypes.Permission &&
                string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase)
            );

            if (hasPermission)
                context.Succeed(requirement);

            return Task.CompletedTask;
        }
    }
}
