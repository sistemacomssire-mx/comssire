namespace Comssire.DTOs.Sync;

public class SyncExistenciaAlmacenDto
{
    public string CveArt { get; set; } = default!;
    public int CveAlm { get; set; }
    public string? Status { get; set; }
    public decimal? Exist { get; set; }
    public decimal? StockMin { get; set; }
    public decimal? StockMax { get; set; }
    public int? CompXRec { get; set; }
    public string? Uuid { get; set; }
    public DateTime? VersionSinc { get; set; }
    public decimal? PendSurt { get; set; }
}