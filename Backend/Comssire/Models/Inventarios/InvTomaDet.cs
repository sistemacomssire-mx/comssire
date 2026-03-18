using System.ComponentModel.DataAnnotations.Schema;

namespace Comssire.Models.Inventarios;

[Table("inv_tomas_det")]
public class InvTomaDet
{
    public long TomaId { get; set; }

    [Column(TypeName = "text")]
    public string CveArt { get; set; } = default!;

    [Column(TypeName = "numeric(18,6)")]
    public decimal ExistSistema { get; set; }

    [Column(TypeName = "numeric(18,6)")]
    public decimal? ExistFisico { get; set; }

    // ✅ FIX: permite guardar UTC
    [Column(TypeName = "timestamp with time zone")]
    public DateTime? CapturadoEn { get; set; }
}