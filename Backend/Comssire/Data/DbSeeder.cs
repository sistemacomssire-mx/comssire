using Comssire.Models.Sistema;
using Comssire.Services.Security;
using Microsoft.EntityFrameworkCore;

namespace Comssire.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IPasswordService passwordService)
    {
        // --------------------------
        // 1) Permisos base
        // --------------------------
        var permisosBase = new List<(string clave, string descripcion)>
        {
            // Dashboard
            ("dashboard.ver", "Ver dashboard principal"),
            ("dashboard.ver_global", "Ver métricas globales"),

            // Compras
            ("compras.ver", "Ver compras"),
            ("compras.crear", "Crear compra"),
            ("compras.editar_propias", "Editar compras propias"),
            ("compras.enviar_aprobacion", "Enviar compra a aprobación"),
            ("compras.ver_aprobaciones", "Ver compras pendientes de aprobación"),
            ("compras.aprobar", "Aprobar compra"),
            ("compras.rechazar", "Rechazar / devolver compra"),
            ("compras.editar_todas", "Editar cualquier compra"),
            ("compras.generar_mod", "Generar archivo MOD"),

            // Usuarios
            ("usuarios.ver", "Ver usuarios"),
            ("usuarios.crear", "Crear usuarios"),
            ("usuarios.editar", "Editar usuarios (activar/desactivar)"),
            ("usuarios.asignar_rol", "Asignar rol a usuario"),
            ("usuarios.reset_password", "Resetear contraseña de usuario"),

            // ✅ Inventarios (NUEVOS)
            ("inventarios.ver", "Ver inventario por almacén"),
            ("inventarios.toma.crear", "Crear toma de inventario"),
            ("inventarios.toma.capturar", "Capturar conteo físico en toma de inventario"),
            ("inventarios.toma.cerrar", "Cerrar toma de inventario"),
            ("inventarios.toma.reporte", "Ver / generar reporte de toma de inventario"),
        };

        foreach (var (clave, desc) in permisosBase)
        {
            var existe = await db.Permisos.AnyAsync(p => p.Clave == clave);
            if (!existe)
            {
                db.Permisos.Add(new Permiso { Clave = clave, Descripcion = desc });
            }
        }
        await db.SaveChangesAsync();

        // --------------------------
        // 2) Rol Admin (todos los permisos)
        // --------------------------
        var adminRol = await db.Roles.FirstOrDefaultAsync(r => r.Nombre == "Admin");
        if (adminRol == null)
        {
            adminRol = new Rol { Nombre = "Admin" };
            db.Roles.Add(adminRol);
            await db.SaveChangesAsync();
        }

        var allPermIds = await db.Permisos.Select(p => p.Id).ToListAsync();
        var adminPermIds = await db.RolesPermisos.Where(rp => rp.RolId == adminRol.Id)
            .Select(rp => rp.PermisoId)
            .ToListAsync();

        foreach (var pid in allPermIds.Except(adminPermIds))
        {
            db.RolesPermisos.Add(new RolPermiso { RolId = adminRol.Id, PermisoId = pid });
        }
        await db.SaveChangesAsync();

        // --------------------------
        // 3) Rol Trabajador (captura compras)
        // --------------------------
        var trabajadorRol = await db.Roles.FirstOrDefaultAsync(r => r.Nombre == "Trabajador");
        if (trabajadorRol == null)
        {
            trabajadorRol = new Rol { Nombre = "Trabajador" };
            db.Roles.Add(trabajadorRol);
            await db.SaveChangesAsync();
        }

        // ✅ Permisos del trabajador:
        var clavesTrabajador = new[]
        {
            "compras.crear",
            "compras.editar_propias",
            "compras.enviar_aprobacion",
            "compras.ver",

            // ✅ si quieres que trabajador pueda ver inventarios, descomenta:
            // "inventarios.ver"
        };

        var trabajadorPermIds = await db.Permisos
            .Where(p => clavesTrabajador.Contains(p.Clave))
            .Select(p => p.Id)
            .ToListAsync();

        var currentTrabajador = await db.RolesPermisos.Where(rp => rp.RolId == trabajadorRol.Id)
            .Select(rp => rp.PermisoId)
            .ToListAsync();

        foreach (var pid in trabajadorPermIds.Except(currentTrabajador))
        {
            db.RolesPermisos.Add(new RolPermiso { RolId = trabajadorRol.Id, PermisoId = pid });
        }
        await db.SaveChangesAsync();

        // --------------------------
        // 4) Usuario admin default
        // --------------------------
        var adminUser = await db.Usuarios.FirstOrDefaultAsync(u => u.Username == "admin");
        if (adminUser == null)
        {
            adminUser = new Usuario
            {
                Nombre = "Admin",
                Apellidos = "Sistema",
                Username = "admin",
                RolId = adminRol.Id,
                Activo = true,
                MustChangePassword = false,
                CreatedAtUtc = DateTime.UtcNow
            };

            adminUser.PasswordHash = passwordService.HashPassword(adminUser, "Admin12345!");
            db.Usuarios.Add(adminUser);
            await db.SaveChangesAsync();
        }
    }
}