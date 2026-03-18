using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Comssire.Models.Firebird;

[Table("fb_existencias_almacen")]
public class FbExistenciaAlmacen
{
    [Column(TypeName = "text")]
    public string CveArt { get; set; } = default!;          // CVE_ART

    public int CveAlm { get; set; }                         // CVE_ALM

    [MaxLength(5)]
    public string? Status { get; set; }                     // STATUS

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Exist { get; set; }                     // EXIST

    [Column(TypeName = "numeric(18,6)")]
    public decimal? StockMin { get; set; }                  // STOCK_MIN

    [Column(TypeName = "numeric(18,6)")]
    public decimal? StockMax { get; set; }                  // STOCK_MAX

    public int? CompXRec { get; set; }                      // COMP_X_REC

    [Column(TypeName = "text")]
    public string? Uuid { get; set; }                       // UUID

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? VersionSinc { get; set; }              // VERSION_SINC

    [Column(TypeName = "numeric(18,6)")]
    public decimal? PendSurt { get; set; }                  // PEND_SURT
}
