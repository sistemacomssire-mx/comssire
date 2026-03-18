namespace Comssire.SyncAgent.Models;

public class SyncAlmacenDto
{
    public int CveAlm { get; set; }
    public string? Descr { get; set; }
    public string? Direccion { get; set; }
    public string? Encargado { get; set; }
    public string? Telefono { get; set; }
    public decimal? ListaPrec { get; set; }
    public int? CveMent { get; set; }
    public int? CveMsal { get; set; }
    public string? Status { get; set; }
    public decimal? Lat { get; set; }
    public decimal? Lon { get; set; }
    public string? Uuid { get; set; }
    public DateTime? VersionSinc { get; set; }
    public string? UbiDest { get; set; }
}