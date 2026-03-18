namespace Comssire.DTOs.Catalogos;

public class ExistenciaAlmacenDto
{
    public string CveArt { get; set; } = default!;
    public int CveAlm { get; set; }
    public decimal? Exist { get; set; }
    public decimal? StockMin { get; set; }
    public decimal? StockMax { get; set; }
    public decimal? PendSurt { get; set; }
}
