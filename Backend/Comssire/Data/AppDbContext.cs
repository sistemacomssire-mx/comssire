using Comssire.Models;
using Comssire.Models.Compras;
using Comssire.Models.ComprasRemision;
using Comssire.Models.Firebird;
using Comssire.Models.Inventarios;
using Comssire.Models.Sistema;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Comssire.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // FIREBIRD (Espejo)
    public DbSet<FbProducto> FbProductos => Set<FbProducto>();
    public DbSet<FbProveedor> FbProveedores => Set<FbProveedor>();
    public DbSet<FbAlmacen> FbAlmacenes => Set<FbAlmacen>();
    public DbSet<FbExistenciaAlmacen> FbExistenciasAlmacen => Set<FbExistenciaAlmacen>();

    // SISTEMA
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Permiso> Permisos => Set<Permiso>();
    public DbSet<RolPermiso> RolesPermisos => Set<RolPermiso>();

    // COMPRAS
    public DbSet<Compra> Compras => Set<Compra>();
    public DbSet<CompraPartida> CompraPartidas => Set<CompraPartida>();
    public DbSet<CompraPartidaAlmacen> CompraPartidasAlmacen => Set<CompraPartidaAlmacen>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();
    public DbSet<CompraFactura> CompraFacturas => Set<CompraFactura>();

    // COMPRAS POR NOTA DE REMISION
    public DbSet<CompraRemision> ComprasRemision => Set<CompraRemision>();
    public DbSet<CompraRemisionPartida> CompraRemisionPartidas => Set<CompraRemisionPartida>();
    public DbSet<CompraRemisionPartidaAlmacen> CompraRemisionPartidasAlmacen => Set<CompraRemisionPartidaAlmacen>();


    // INVENTARIOS (TOMA)
    public DbSet<InvToma> InvTomas => Set<InvToma>();
    public DbSet<InvTomaDet> InvTomasDet => Set<InvTomaDet>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // =========================
        // CONVERTERS DE FECHA
        // =========================

        // Para tablas del sistema propio: guardar/leer como UTC
        var utcConverter = new ValueConverter<DateTime, DateTime>(
            v => v.Kind == DateTimeKind.Utc ? v :
                 v.Kind == DateTimeKind.Local ? v.ToUniversalTime() :
                 DateTime.SpecifyKind(v, DateTimeKind.Utc),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
        );

        var utcNullableConverter = new ValueConverter<DateTime?, DateTime?>(
            v => v == null ? null :
                 v.Value.Kind == DateTimeKind.Utc ? v.Value :
                 v.Value.Kind == DateTimeKind.Local ? v.Value.ToUniversalTime() :
                 DateTime.SpecifyKind(v.Value, DateTimeKind.Utc),
            v => v == null ? null : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)
        );

        // Para tablas espejo de Firebird: guardar/leer como Unspecified
        var unspecifiedConverter = new ValueConverter<DateTime, DateTime>(
            v => v.Kind == DateTimeKind.Unspecified ? v : DateTime.SpecifyKind(v, DateTimeKind.Unspecified),
            v => DateTime.SpecifyKind(v, DateTimeKind.Unspecified)
        );

        var unspecifiedNullableConverter = new ValueConverter<DateTime?, DateTime?>(
            v => v == null ? null :
                 v.Value.Kind == DateTimeKind.Unspecified ? v.Value :
                 DateTime.SpecifyKind(v.Value, DateTimeKind.Unspecified),
            v => v == null ? null : DateTime.SpecifyKind(v.Value, DateTimeKind.Unspecified)
        );

        // Entidades espejo Firebird: usar Unspecified
        var firebirdMirrorTypes = new HashSet<Type>
        {
            typeof(FbProducto),
            typeof(FbProveedor),
            typeof(FbAlmacen),
            typeof(FbExistenciaAlmacen)
        };

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var clrType = entityType.ClrType;
            if (clrType == null) continue;

            var isFirebirdMirror = firebirdMirrorTypes.Contains(clrType);

            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(isFirebirdMirror ? unspecifiedConverter : utcConverter);
                }

                if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(isFirebirdMirror ? unspecifiedNullableConverter : utcNullableConverter);
                }
            }
        }

        // =========================
        // FIREBIRD
        // =========================
        modelBuilder.Entity<FbExistenciaAlmacen>()
            .HasKey(x => new { x.CveArt, x.CveAlm });

        modelBuilder.Entity<FbProducto>()
            .HasIndex(x => x.Descr);

        modelBuilder.Entity<FbProveedor>()
            .HasIndex(x => x.Nombre);

        // Fuerza columnas de fecha de espejo Firebird como timestamp without time zone
        ConfigureFirebirdDateColumns(modelBuilder.Entity<FbProducto>());
        ConfigureFirebirdDateColumns(modelBuilder.Entity<FbProveedor>());
        ConfigureFirebirdDateColumns(modelBuilder.Entity<FbAlmacen>());
        ConfigureFirebirdDateColumns(modelBuilder.Entity<FbExistenciaAlmacen>());

        // =========================
        // INVENTARIOS (TOMA)
        // =========================
        modelBuilder.Entity<InvTomaDet>()
            .HasKey(x => new { x.TomaId, x.CveArt });

        modelBuilder.Entity<InvToma>()
            .HasMany(t => t.Detalles)
            .WithOne()
            .HasForeignKey(d => d.TomaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InvToma>()
            .HasIndex(t => new { t.CveAlm, t.Status });

        modelBuilder.Entity<InvTomaDet>()
            .HasIndex(d => d.TomaId);

        // =========================
        // SISTEMA
        // =========================
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<Rol>()
            .HasIndex(r => r.Nombre)
            .IsUnique();

        modelBuilder.Entity<Permiso>()
            .HasIndex(p => p.Clave)
            .IsUnique();

        modelBuilder.Entity<Usuario>()
            .HasOne(u => u.Rol)
            .WithMany(r => r.Usuarios)
            .HasForeignKey(u => u.RolId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RolPermiso>()
            .HasKey(rp => new { rp.RolId, rp.PermisoId });

        modelBuilder.Entity<RolPermiso>()
            .HasOne(rp => rp.Rol)
            .WithMany(r => r.RolesPermisos)
            .HasForeignKey(rp => rp.RolId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RolPermiso>()
            .HasOne(rp => rp.Permiso)
            .WithMany(p => p.RolesPermisos)
            .HasForeignKey(rp => rp.PermisoId)
            .OnDelete(DeleteBehavior.Cascade);

        // =========================
        // COMPRAS
        // =========================
        modelBuilder.Entity<Compra>()
            .HasIndex(c => new { c.CveClpv, c.FolioFactura })
            .IsUnique();

        modelBuilder.Entity<Compra>()
            .HasMany(c => c.Partidas)
            .WithOne(p => p.Compra)
            .HasForeignKey(p => p.CompraId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CompraPartida>()
            .HasMany(p => p.Repartos)
            .WithOne(r => r.Partida)
            .HasForeignKey(r => r.CompraPartidaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Compra>()
            .HasOne(c => c.CreadoPor)
            .WithMany()
            .HasForeignKey(c => c.CreadoPorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Compra>()
            .HasOne(c => c.EnviadoPor)
            .WithMany()
            .HasForeignKey(c => c.EnviadoPorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Compra>()
            .HasOne(c => c.AprobadoPor)
            .WithMany()
            .HasForeignKey(c => c.AprobadoPorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Compra>()
            .HasOne(c => c.RechazadoPor)
            .WithMany()
            .HasForeignKey(c => c.RechazadoPorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Compra>()
            .HasIndex(c => c.Estado);

        modelBuilder.Entity<Compra>()
            .HasIndex(c => c.Fecha);

        modelBuilder.Entity<CompraPartida>()
            .HasIndex(p => p.CveArt);

        modelBuilder.Entity<MovimientoInventario>()
            .HasIndex(m => new { m.CveArt, m.NumAlm });

        modelBuilder.Entity<MovimientoInventario>()
            .HasIndex(m => m.CompraId);

        modelBuilder.Entity<CompraFactura>()
            .HasIndex(x => x.CompraId)
            .IsUnique();

        modelBuilder.Entity<CompraFactura>()
            .HasIndex(x => x.UploadedByUserId);

        modelBuilder.Entity<CompraFactura>()
            .HasOne<Compra>()
            .WithOne()
            .HasForeignKey<CompraFactura>(x => x.CompraId)
            .OnDelete(DeleteBehavior.Cascade);

        // =========================
        // COMPRAS POR NOTA DE REMISION
        // =========================
        modelBuilder.Entity<CompraRemision>()
            .HasMany(c => c.Partidas)
            .WithOne(p => p.CompraRemision)
            .HasForeignKey(p => p.CompraRemisionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CompraRemisionPartida>()
            .HasMany(p => p.Repartos)
            .WithOne(r => r.Partida)
            .HasForeignKey(r => r.CompraRemisionPartidaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CompraRemision>()
            .HasOne(c => c.CreadoPor)
            .WithMany()
            .HasForeignKey(c => c.CreadoPorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CompraRemision>()
            .HasIndex(c => c.FolioRemision);

        modelBuilder.Entity<CompraRemision>()
            .HasIndex(c => c.Fecha);

        modelBuilder.Entity<CompraRemision>()
            .HasIndex(c => c.CveClpv);

        modelBuilder.Entity<CompraRemisionPartida>()
            .HasIndex(p => p.CveArt);

        modelBuilder.Entity<CompraRemisionPartidaAlmacen>()
            .HasIndex(r => r.NumAlm);


        base.OnModelCreating(modelBuilder);
    }

    private static void ConfigureFirebirdDateColumns<TEntity>(EntityTypeBuilder<TEntity> builder)
        where TEntity : class
    {
        foreach (var property in builder.Metadata.GetProperties())
        {
            if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
            {
                property.SetColumnType("timestamp without time zone");
            }
        }
    }
}