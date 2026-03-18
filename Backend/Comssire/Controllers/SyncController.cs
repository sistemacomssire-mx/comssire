using Comssire.Data;
using Comssire.DTOs.Sync;
using Comssire.Models;
using Comssire.Models.Firebird;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Comssire.Controllers;

[ApiController]
[Route("api/sync")]
public class SyncController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _cfg;
    private readonly ILogger<SyncController> _logger;

    public SyncController(AppDbContext db, IConfiguration cfg, ILogger<SyncController> logger)
    {
        _db = db;
        _cfg = cfg;
        _logger = logger;
    }

    private bool IsValidSyncKey()
    {
        var expected = _cfg["SyncSecurity:ApiKey"];
        var provided = Request.Headers["X-Sync-Api-Key"].FirstOrDefault();

        return !string.IsNullOrWhiteSpace(expected)
               && !string.IsNullOrWhiteSpace(provided)
               && string.Equals(expected, provided, StringComparison.Ordinal);
    }

    private static DateTime? FixDate(DateTime? value)
    {
        if (!value.HasValue)
            return null;

        return DateTime.SpecifyKind(value.Value, DateTimeKind.Unspecified);
    }

    [HttpPost("upsert-delta")]
    public async Task<IActionResult> UpsertDelta([FromBody] IncrementalSyncRequestDto request, CancellationToken ct)
    {
        if (!IsValidSyncKey())
            return Unauthorized(new { ok = false, message = "Sync API key inválida." });

        if (request is null)
            return BadRequest(new { ok = false, message = "Payload vacío." });

        using var tx = await _db.Database.BeginTransactionAsync(ct);

        try
        {
            _logger.LogInformation(
                "Iniciando upsert delta. Prov={Prov}, Prod={Prod}, Alm={Alm}, Exist={Exist}",
                request.Proveedores.Count,
                request.Productos.Count,
                request.Almacenes.Count,
                request.Existencias.Count);

            // PROVEEDORES
            if (request.Proveedores.Count > 0)
            {
                var claves = request.Proveedores
                    .Select(x => x.Clave)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .ToList();

                var existentes = await _db.FbProveedores
                    .Where(x => claves.Contains(x.Clave))
                    .ToDictionaryAsync(x => x.Clave, ct);

                foreach (var x in request.Proveedores)
                {
                    if (!existentes.TryGetValue(x.Clave, out var entity))
                    {
                        entity = new FbProveedor { Clave = x.Clave };
                        _db.FbProveedores.Add(entity);
                        existentes[x.Clave] = entity;
                    }

                    entity.Status = x.Status;
                    entity.Nombre = x.Nombre;
                    entity.Rfc = x.Rfc;
                    entity.Calle = x.Calle;
                    entity.NumInt = x.NumInt;
                    entity.NumExt = x.NumExt;
                    entity.Cruzamientos = x.Cruzamientos;
                    entity.Cruzamientos2 = x.Cruzamientos2;
                    entity.Colonia = x.Colonia;
                    entity.Codigo = x.Codigo;
                    entity.Localidad = x.Localidad;
                    entity.Municipio = x.Municipio;
                    entity.Estado = x.Estado;
                    entity.CvePais = x.CvePais;
                    entity.Telefono = x.Telefono;
                    entity.Clasific = x.Clasific;
                    entity.ConCredito = x.ConCredito;
                    entity.DiasCred = x.DiasCred;
                    entity.LimCred = x.LimCred;
                    entity.UltPagoD = x.UltPagoD;
                    entity.UltPagoM = x.UltPagoM;
                    entity.UltPagoF = FixDate(x.UltPagoF);
                    entity.UltCompD = x.UltCompD;
                    entity.UltCompM = x.UltCompM;
                    entity.UltCompF = FixDate(x.UltCompF);
                    entity.Saldo = x.Saldo;
                    entity.Ventas = x.Ventas;
                    entity.Descuento = x.Descuento;
                    entity.TipTercero = x.TipTercero;
                    entity.TipOpera = x.TipOpera;
                    entity.CveObs = x.CveObs;
                    entity.CuentaContable = x.CuentaContable;
                    entity.FormaPago = x.FormaPago;
                    entity.Banco = x.Banco;
                    entity.DescOtros = x.DescOtros;
                    entity.Imprir = x.Imprir;
                    entity.Mail = x.Mail;
                    entity.Enviosilen = x.Enviosilen;
                    entity.Emailpred = x.Emailpred;
                    entity.Lat = x.Lat;
                    entity.Lon = x.Lon;
                }
            }

            // PRODUCTOS
            if (request.Productos.Count > 0)
            {
                var claves = request.Productos
                    .Select(x => x.CveArt)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .ToList();

                var existentes = await _db.FbProductos
                    .Where(x => claves.Contains(x.CveArt))
                    .ToDictionaryAsync(x => x.CveArt, ct);

                foreach (var x in request.Productos)
                {
                    if (!existentes.TryGetValue(x.CveArt, out var entity))
                    {
                        entity = new FbProducto { CveArt = x.CveArt };
                        _db.FbProductos.Add(entity);
                        existentes[x.CveArt] = entity;
                    }

                    entity.Descr = x.Descr;
                    entity.LinProd = x.LinProd;
                    entity.ConSerie = x.ConSerie;
                    entity.UniMed = x.UniMed;
                    entity.UniEmp = x.UniEmp;
                    entity.CtrlAlm = x.CtrlAlm;
                    entity.TiemSurt = x.TiemSurt;
                    entity.StockMin = x.StockMin;
                    entity.StockMax = x.StockMax;
                    entity.TipCosteo = x.TipCosteo;
                    entity.NumMon = x.NumMon;
                    entity.FchUltCom = FixDate(x.FchUltCom);
                    entity.CompXRec = x.CompXRec;
                    entity.FchUltVta = FixDate(x.FchUltVta);
                    entity.PendSurt = x.PendSurt;
                    entity.Exist = x.Exist;
                    entity.CostoProm = x.CostoProm;
                    entity.UltCosto = x.UltCosto;
                    entity.CveObs = x.CveObs;
                    entity.TipoEle = x.TipoEle;
                    entity.UniAlt = x.UniAlt;
                    entity.FacConv = x.FacConv;
                    entity.Apart = x.Apart;
                    entity.ConLote = x.ConLote;
                    entity.ConPedimento = x.ConPedimento;
                    entity.Peso = x.Peso;
                    entity.Volumen = x.Volumen;
                    entity.CveEsqImpu = x.CveEsqImpu;
                    entity.VtasAnlC = x.VtasAnlC;
                    entity.VtasAnlM = x.VtasAnlM;
                    entity.CompAnlC = x.CompAnlC;
                    entity.CompAnlM = x.CompAnlM;
                    entity.CuentCont = x.CuentCont;
                    entity.BlkCstExt = x.BlkCstExt;
                    entity.Status = x.Status;
                    entity.ManIeps = x.ManIeps;
                    entity.AplManImp = x.AplManImp;
                    entity.CuotaIeps = x.CuotaIeps;
                    entity.AplManIeps = x.AplManIeps;
                    entity.Uuid = x.Uuid;
                    entity.VersionSinc = FixDate(x.VersionSinc);
                    entity.VersionSincFechaImg = FixDate(x.VersionSincFechaImg);
                    entity.CveProdserv = x.CveProdserv;
                    entity.CveUnidad = x.CveUnidad;
                    entity.LargoMl = x.LargoMl;
                    entity.AltoMl = x.AltoMl;
                    entity.AnchoMl = x.AnchoMl;
                    entity.FacUnidCce = x.FacUnidCce;
                }
            }

            // ALMACENES
            if (request.Almacenes.Count > 0)
            {
                var claves = request.Almacenes
                    .Select(x => x.CveAlm)
                    .Distinct()
                    .ToList();

                var existentes = await _db.FbAlmacenes
                    .Where(x => claves.Contains(x.CveAlm))
                    .ToDictionaryAsync(x => x.CveAlm, ct);

                foreach (var x in request.Almacenes)
                {
                    if (!existentes.TryGetValue(x.CveAlm, out var entity))
                    {
                        entity = new FbAlmacen { CveAlm = x.CveAlm };
                        _db.FbAlmacenes.Add(entity);
                        existentes[x.CveAlm] = entity;
                    }

                    entity.Descr = x.Descr;
                    entity.Direccion = x.Direccion;
                    entity.Encargado = x.Encargado;
                    entity.Telefono = x.Telefono;
                    entity.ListaPrec = x.ListaPrec;
                    entity.CveMent = x.CveMent;
                    entity.CveMsal = x.CveMsal;
                    entity.Status = x.Status;
                    entity.Lat = x.Lat;
                    entity.Lon = x.Lon;
                    entity.Uuid = x.Uuid;
                    entity.VersionSinc = FixDate(x.VersionSinc);
                    entity.UbiDest = x.UbiDest;
                }
            }

            // EXISTENCIAS - FULL UPSERT
            if (request.Existencias.Count > 0)
            {
                var arts = request.Existencias
                    .Select(x => x.CveArt)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .ToList();

                var alms = request.Existencias
                    .Select(x => x.CveAlm)
                    .Distinct()
                    .ToList();

                var existentes = await _db.FbExistenciasAlmacen
                    .Where(x => arts.Contains(x.CveArt) && alms.Contains(x.CveAlm))
                    .ToListAsync(ct);

                var dict = existentes.ToDictionary(
                    x => $"{x.CveArt}||{x.CveAlm}",
                    x => x);

                foreach (var x in request.Existencias)
                {
                    var key = $"{x.CveArt}||{x.CveAlm}";

                    if (!dict.TryGetValue(key, out var entity))
                    {
                        entity = new FbExistenciaAlmacen
                        {
                            CveArt = x.CveArt,
                            CveAlm = x.CveAlm
                        };
                        _db.FbExistenciasAlmacen.Add(entity);
                        dict[key] = entity;
                    }

                    entity.Status = x.Status;
                    entity.Exist = x.Exist;
                    entity.StockMin = x.StockMin;
                    entity.StockMax = x.StockMax;
                    entity.CompXRec = x.CompXRec;
                    entity.Uuid = x.Uuid;
                    entity.VersionSinc = FixDate(x.VersionSinc);
                    entity.PendSurt = x.PendSurt;
                }
            }

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            _logger.LogInformation(
                "Upsert delta completado. Prov={Prov}, Prod={Prod}, Alm={Alm}, Exist={Exist}",
                request.Proveedores.Count,
                request.Productos.Count,
                request.Almacenes.Count,
                request.Existencias.Count);

            return Ok(new
            {
                ok = true,
                proveedores = request.Proveedores.Count,
                productos = request.Productos.Count,
                almacenes = request.Almacenes.Count,
                existencias = request.Existencias.Count
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync(ct);

            _logger.LogError(ex, "Error en upsert delta de sincronización.");

            return StatusCode(500, new
            {
                ok = false,
                message = "Error al procesar sincronización incremental.",
                detail = ex.Message,
                inner = ex.InnerException?.Message,
                full = ex.ToString()
            });
        }
    }
}