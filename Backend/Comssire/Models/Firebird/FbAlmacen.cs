using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Comssire.Models.Firebird;

[Table("fb_almacenes")]
public class FbAlmacen
{
    [Key]
    public int CveAlm { get; set; }                         // CVE_ALM
    [Column(TypeName = "text")]
    public string? Descr { get; set; }                      // DESCR

    [Column(TypeName = "text")]
    public string? Direccion { get; set; }                  // DIRECCION

    [Column(TypeName = "text")]
    public string? Encargado { get; set; }                  // ENCARGADO

    [Column(TypeName = "text")]
    public string? Telefono { get; set; }                   // TELEFONO

    [Column(TypeName = "numeric(18,6)")]
    public decimal? ListaPrec { get; set; }                 // LISTA_PREC

    public int? CveMent { get; set; }                       // CVE_MENT
    public int? CveMsal { get; set; }                       // CVE_MSAL

    [MaxLength(5)]
    public string? Status { get; set; }                     // STATUS

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Lat { get; set; }                       // LAT

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Lon { get; set; }                       // LON
    [Column(TypeName = "text")]
    public string? Uuid { get; set; }                       // UUID

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? VersionSinc { get; set; }              // VERSION_SINC
    [Column(TypeName = "text")]
    public string? UbiDest { get; set; }                    // UBI_DEST
}
