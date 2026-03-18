using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Comssire.Models.Inventarios;

[Table("inv_tomas")]
public class InvToma
{
    [Key]
    public long Id { get; set; }

    public int CveAlm { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "ABIERTA"; // ABIERTA | CERRADA

    // ✅ FIX: permite DateTime.UtcNow sin error
    [Column(TypeName = "timestamp with time zone")]
    public DateTime CreadaEn { get; set; } = DateTime.UtcNow;

    public int? CreadaPorUserId { get; set; }

    // ✅ FIX: permite guardar UTC
    [Column(TypeName = "timestamp with time zone")]
    public DateTime? CerradaEn { get; set; }

    public int? CerradaPorUserId { get; set; }

    public List<InvTomaDet> Detalles { get; set; } = new();
}