namespace Comssire.Models.Sistema
{
    /*
     * Tabla intermedia que relaciona Roles con Permisos.
     * Permite que un rol tenga muchos permisos
     * y que un permiso pueda pertenecer a varios roles.
     */
    public class RolPermiso
    {
        // Clave foránea hacia Rol
        public int RolId { get; set; }
        public Rol Rol { get; set; } = null!;

        // Clave foránea hacia Permiso
        public int PermisoId { get; set; }
        public Permiso Permiso { get; set; } = null!;
    }
}
