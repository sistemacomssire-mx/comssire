namespace Comssire.Models.Sistema
{
    /*
     * Representa un permiso específico del sistema.
     * Se recomienda usar claves por módulo y acción.
     * Ejemplo: "CATALOGOS.PRODUCTO.VER"
     */
    public class Permiso
    {
        // Clave primaria
        public int Id { get; set; }

        // Clave única del permiso
        public string Clave { get; set; } = string.Empty;

        // Descripción opcional del permiso
        public string? Descripcion { get; set; }

        // Relación muchos a muchos con roles (usando RolPermiso)
        public ICollection<RolPermiso> RolesPermisos { get; set; } = new List<RolPermiso>();
    }
}
