namespace Comssire.DTOs.Compras
{
    public class CompraCreateDto
    {
        public string FolioFactura { get; set; } = "";
        public DateTime Fecha { get; set; }
        public string CveClpv { get; set; } = "";
        public int NumAlmaDefault { get; set; }
        public string? Observaciones { get; set; }
    }

    public class CompraUpdateDto : CompraCreateDto { }

    public class CompraAddPartidaDto
    {
        public string CveArt { get; set; } = "";
        public decimal CantTotal { get; set; }
        public decimal CostoUnitario { get; set; }
        public string? Observaciones { get; set; }
        public List<CompraRepartoDto>? Repartos { get; set; }
    }

    public class CompraUpdatePartidaDto
    {
        public decimal CantTotal { get; set; }
        public decimal CostoUnitario { get; set; }
        public string? Observaciones { get; set; }
        public List<CompraRepartoDto>? Repartos { get; set; }
    }

    public class CompraRepartoDto
    {
        public int NumAlm { get; set; }
        public decimal Cant { get; set; }
    }

    public class CompraRechazarDto
    {
        public string Motivo { get; set; } = "";
    }

    public class CompraResponseDto
    {
        public Guid Id { get; set; }
        public string FolioFactura { get; set; } = "";
        public DateTime Fecha { get; set; }
        public string CveClpv { get; set; } = "";
        public int NumAlmaDefault { get; set; }
        public string? Observaciones { get; set; }
        public object Estado { get; set; } = default!;
        public string? MotivoRechazo { get; set; }
        public List<CompraPartidaResponseDto> Partidas { get; set; } = new();
    }

    public class CompraPartidaResponseDto
    {
        public Guid Id { get; set; }
        public string CveArt { get; set; } = "";
        public decimal CantTotal { get; set; }
        public decimal CostoUnitario { get; set; }
        public string? Observaciones { get; set; }
        public List<CompraPartidaAlmacenResponseDto> Repartos { get; set; } = new();
    }

    public class CompraPartidaAlmacenResponseDto
    {
        public Guid Id { get; set; }
        public int NumAlm { get; set; }
        public decimal Cant { get; set; }
    }
}
