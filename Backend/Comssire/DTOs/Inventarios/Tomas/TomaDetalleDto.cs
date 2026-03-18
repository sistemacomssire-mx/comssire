namespace Comssire.DTOs.Inventarios.Tomas;

public class TomaDetalleDto
{
    public string CveArt { get; set; } = default!;
    public string? Descr { get; set; }
    public string? UniMed { get; set; }

    public decimal ExistSistema { get; set; }
    public decimal? ExistFisico { get; set; }
    public decimal Diferencia { get; set; }
    public bool Capturado { get; set; }
}