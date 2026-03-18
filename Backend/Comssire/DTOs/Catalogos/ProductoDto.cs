namespace Comssire.DTOs.Catalogos;

public class ProductoDto
{
    public string CveArt { get; set; } = default!;
    public string? Descr { get; set; }
    public decimal? UltCosto { get; set; }
    public decimal? Exist { get; set; }
    public string? UniMed { get; set; }
    public string? Status { get; set; }
}
