namespace Comssire.Auth
{
    /*
     * PermissionClaimTypes
     * --------------------
     * Define el nombre del claim que usaremos para guardar permisos en el JWT.
     *
     * Ejemplo de claim:
     *  type: "permission"
     *  value: "CATALOGOS.PRODUCTO.VER"
     */
    public static class PermissionClaimTypes
    {
        public const string Permission = "permission";
    }
}
