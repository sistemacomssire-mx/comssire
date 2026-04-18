using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Comssire.Models.ComprasRemision
{
    public class CompraRemisionPartida
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CompraRemisionId { get; set; }

        [JsonIgnore]
        public CompraRemision? CompraRemision { get; set; }

        // Regla observada para nota de remisión:
        // Producto máximo 16
        [Required, MaxLength(16)]
        public string CveArt { get; set; } = string.Empty;

        // Regla observada para nota de remisión:
        // Descripción máximo 40
        [Required, MaxLength(40)]
        public string Descripcion { get; set; } = string.Empty;

        public decimal CantTotal { get; set; }

        // En remisión sí necesitaremos ambos para MOD/PDF
        public decimal CostoUnitario { get; set; }
        public decimal PrecioUnitario { get; set; }

        [Required, MaxLength(10)]
        public string UniVenta { get; set; } = "PZ";

        public decimal IvaPct { get; set; } = 16m;

        [MaxLength(255)]
        public string? Observaciones { get; set; }

        public List<CompraRemisionPartidaAlmacen> Repartos { get; set; } = new();
    }
}