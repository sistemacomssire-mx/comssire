namespace Comssire.DTOs.Inventarios.Tomas;

public class TomaDto
{
    public long Id { get; set; }

    public int CveAlm { get; set; }
    public string? AlmacenDescr { get; set; }

    public string Status { get; set; } = default!;

    public DateTime CreadaEn { get; set; }
    public DateTime? CerradaEn { get; set; }

    public int? CreadaPorUserId { get; set; }
    public string? CreadaPorNombre { get; set; }

    public int TotalProductos { get; set; }
    public int Capturados { get; set; }

    public int ConDiferencia { get; set; }
}