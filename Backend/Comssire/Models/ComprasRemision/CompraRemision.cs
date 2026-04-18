using System.ComponentModel.DataAnnotations;
using Comssire.Models.Sistema;

namespace Comssire.Models.ComprasRemision
{
    public class CompraRemision
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(30)]
        public string FolioRemision { get; set; } = string.Empty;

        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        [Required, MaxLength(10)]
        public string CveClpv { get; set; } = string.Empty;

        public int NumAlmaDefault { get; set; } = 1;

        [MaxLength(255)]
        public string? Observaciones { get; set; }

        public int CreadoPorUserId { get; set; }
        public Usuario? CreadoPor { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ModGeneradoAt { get; set; }

        public int? ModConsecutivo { get; set; }

        public List<CompraRemisionPartida> Partidas { get; set; } = new();
    }
}