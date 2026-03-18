namespace Comssire.DTOs.Sync;

public class SyncProveedorDto
{
    public string Clave { get; set; } = default!;
    public string? Status { get; set; }
    public string? Nombre { get; set; }
    public string? Rfc { get; set; }
    public string? Calle { get; set; }
    public int? NumInt { get; set; }
    public string? NumExt { get; set; }
    public string? Cruzamientos { get; set; }
    public string? Cruzamientos2 { get; set; }
    public string? Colonia { get; set; }
    public int? Codigo { get; set; }
    public string? Localidad { get; set; }
    public string? Municipio { get; set; }
    public string? Estado { get; set; }
    public string? CvePais { get; set; }
    public string? Telefono { get; set; }
    public string? Clasific { get; set; }
    public string? ConCredito { get; set; }
    public int? DiasCred { get; set; }
    public decimal? LimCred { get; set; }
    public string? UltPagoD { get; set; }
    public decimal? UltPagoM { get; set; }
    public DateTime? UltPagoF { get; set; }
    public int? UltCompD { get; set; }
    public decimal? UltCompM { get; set; }
    public DateTime? UltCompF { get; set; }
    public decimal? Saldo { get; set; }
    public decimal? Ventas { get; set; }
    public decimal? Descuento { get; set; }
    public int? TipTercero { get; set; }
    public int? TipOpera { get; set; }
    public int? CveObs { get; set; }
    public string? CuentaContable { get; set; }
    public string? FormaPago { get; set; }
    public string? Banco { get; set; }
    public string? DescOtros { get; set; }
    public string? Imprir { get; set; }
    public string? Mail { get; set; }
    public string? Enviosilen { get; set; }
    public string? Emailpred { get; set; }
    public decimal? Lat { get; set; }
    public decimal? Lon { get; set; }
}