using System.ComponentModel.DataAnnotations;

namespace Comssire.DTOs.ComprasRemision
{
    public class CompraRemisionCreateDto
    {
        [Required, MaxLength(30)]
        public string FolioRemision { get; set; } = "";

        public DateTime Fecha { get; set; }

        [Required, MaxLength(10)]
        public string CveClpv { get; set; } = "";

        public int NumAlmaDefault { get; set; } = 1;

        [MaxLength(255)]
        public string? Observaciones { get; set; }
    }

    public class CompraRemisionUpdateDto : CompraRemisionCreateDto { }

    public class CompraRemisionAddPartidaDto
    {
        [Required, MaxLength(16)]
        public string CveArt { get; set; } = "";

        [Required, MaxLength(40)]
        public string Descripcion { get; set; } = "";

        [Range(0.000001, double.MaxValue)]
        public decimal CantTotal { get; set; }

        [Range(0, double.MaxValue)]
        public decimal CostoUnitario { get; set; }

        [Range(0, double.MaxValue)]
        public decimal PrecioUnitario { get; set; }

        [MaxLength(10)]
        public string UniVenta { get; set; } = "PZ";

        [Range(0, 100)]
        public decimal IvaPct { get; set; } = 16m;

        [MaxLength(255)]
        public string? Observaciones { get; set; }

        public List<CompraRemisionRepartoDto>? Repartos { get; set; }
    }

    public class CompraRemisionUpdatePartidaDto
    {
        [Required, MaxLength(16)]
        public string CveArt { get; set; } = "";

        [Required, MaxLength(40)]
        public string Descripcion { get; set; } = "";

        [Range(0.000001, double.MaxValue)]
        public decimal CantTotal { get; set; }

        [Range(0, double.MaxValue)]
        public decimal CostoUnitario { get; set; }

        [Range(0, double.MaxValue)]
        public decimal PrecioUnitario { get; set; }

        [MaxLength(10)]
        public string UniVenta { get; set; } = "PZ";

        [Range(0, 100)]
        public decimal IvaPct { get; set; } = 16m;

        [MaxLength(255)]
        public string? Observaciones { get; set; }

        public List<CompraRemisionRepartoDto>? Repartos { get; set; }
    }

    public class CompraRemisionRepartoDto
    {
        public int NumAlm { get; set; }

        [Range(0.000001, double.MaxValue)]
        public decimal Cant { get; set; }
    }

    public class CompraRemisionResponseDto
    {
        public Guid Id { get; set; }

        public string FolioRemision { get; set; } = "";

        public DateTime Fecha { get; set; }

        public string CveClpv { get; set; } = "";

        public int NumAlmaDefault { get; set; }

        public string? Observaciones { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public DateTime? ModGeneradoAt { get; set; }

        public int? ModConsecutivo { get; set; }
        public string Estado { get; set; } = "Borrador";

        public List<CompraRemisionPartidaResponseDto> Partidas { get; set; } = new();
    }

    public class CompraRemisionPartidaResponseDto
    {
        public Guid Id { get; set; }

        public string CveArt { get; set; } = "";

        public string Descripcion { get; set; } = "";

        public decimal CantTotal { get; set; }

        public decimal CostoUnitario { get; set; }

        public decimal PrecioUnitario { get; set; }

        public string UniVenta { get; set; } = "PZ";

        public decimal IvaPct { get; set; }

        public string? Observaciones { get; set; }

        public List<CompraRemisionPartidaAlmacenResponseDto> Repartos { get; set; } = new();
    }

    public class CompraRemisionPartidaAlmacenResponseDto
    {
        public Guid Id { get; set; }

        public int NumAlm { get; set; }

        public decimal Cant { get; set; }
    }
}