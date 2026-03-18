namespace Comssire.Models.Sistema
{
    /*
     * Representa un rol del sistema.
     * Ejemplos: Admin, Almacen, Ventas.
     * Un rol puede estar asignado a muchos usuarios.
     * Un rol puede tener muchos permisos.
     */
    public class Rol
    {
        // Clave primaria
        public int Id { get; set; }

        // Nombre del rol (debe ser único)
        public string Nombre { get; set; } = string.Empty;

        // Usuarios que pertenecen a este rol
        public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();

        // Relación muchos a muchos con permisos (usando RolPermiso)
        public ICollection<RolPermiso> RolesPermisos { get; set; } = new List<RolPermiso>();
    }
}
