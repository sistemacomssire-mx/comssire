namespace Comssire.DTOs.Inventarios;

public class InventarioItemDto
{
    public string CveArt { get; set; } = default!;
    public string? Descr { get; set; }
    public string? UniMed { get; set; }

    public int CveAlm { get; set; }

    public decimal? Exist { get; set; }
    public decimal? StockMin { get; set; }
    public decimal? StockMax { get; set; }
    public decimal? PendSurt { get; set; }
}