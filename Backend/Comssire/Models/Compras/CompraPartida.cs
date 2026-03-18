using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Comssire.Models.Compras
{
    public class CompraPartida
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CompraId { get; set; }

        // ✅ Evita ciclo JSON: Compra -> Partidas -> Compra -> Partidas...
        [JsonIgnore]
        public Compra? Compra { get; set; }

        [Required, MaxLength(20)]
        public string CveArt { get; set; } = string.Empty;

        public decimal CantTotal { get; set; }

        public decimal CostoUnitario { get; set; }

        [Required, MaxLength(10)]
        public string UniVenta { get; set; } = "PZ";

        public decimal IvaPct { get; set; } = 16;

        [MaxLength(255)]
        public string? Observaciones { get; set; }

        public List<CompraPartidaAlmacen> Repartos { get; set; } = new();
    }
}