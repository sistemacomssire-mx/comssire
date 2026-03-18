using System.ComponentModel.DataAnnotations;
using Comssire.Models.Sistema;

namespace Comssire.Models.Compras
{
    public class Compra
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(30)]
        public string FolioFactura { get; set; } = string.Empty;

        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        [Required, MaxLength(10)]
        public string CveClpv { get; set; } = string.Empty;

        public int NumAlmaDefault { get; set; } = 1;

        [MaxLength(255)]
        public string? Observaciones { get; set; }

        public CompraEstado Estado { get; set; } = CompraEstado.Borrador;

        [MaxLength(250)]
        public string? MotivoRechazo { get; set; }

        public int CreadoPorUserId { get; set; }
        public Usuario? CreadoPor { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? EnviadoAt { get; set; }
        public DateTime? AprobadoAt { get; set; }
        public DateTime? RechazadoAt { get; set; }
        public DateTime? ModGeneradoAt { get; set; }

        public int? EnviadoPorUserId { get; set; }
        public Usuario? EnviadoPor { get; set; }

        public int? AprobadoPorUserId { get; set; }
        public Usuario? AprobadoPor { get; set; }

        public int? RechazadoPorUserId { get; set; }
        public Usuario? RechazadoPor { get; set; }

        public int? ModConsecutivo { get; set; }

        public List<CompraPartida> Partidas { get; set; } = new();

        public CompraFactura? Factura { get; set; }
    }
}