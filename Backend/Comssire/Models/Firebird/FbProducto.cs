using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Comssire.Models.Firebird;

[Table("fb_productos")]
public class FbProducto
{
    [Key]
    [Column(TypeName = "text")]
    public string CveArt { get; set; } = default!;          // CVE_ART

    [Column(TypeName = "text")]
    public string? Descr { get; set; }                      // DESCR

    [Column(TypeName = "text")]
    public string? LinProd { get; set; }                    // LIN_PROD

    [Column(TypeName = "text")]
    public string? ConSerie { get; set; }                   // CON_SERIE

    [Column(TypeName = "text")]
    public string? UniMed { get; set; }                     // UNI_MED

    public int? UniEmp { get; set; }                        // UNI_EMP

    [Column(TypeName = "text")]
    public string? CtrlAlm { get; set; }                    // CTRL_ALM

    public int? TiemSurt { get; set; }                      // TIEM_SURT

    [Column(TypeName = "numeric(18,6)")]
    public decimal? StockMin { get; set; }                  // STOCK_MIN

    [Column(TypeName = "numeric(18,6)")]
    public decimal? StockMax { get; set; }                  // STOCK_MAX

    [Column(TypeName = "text")]
    public string? TipCosteo { get; set; }                  // TIP_COSTEO

    public int? NumMon { get; set; }                        // NUM_MON

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? FchUltCom { get; set; }                // FCH_ULTCOM

    public int? CompXRec { get; set; }                      // COMP_X_REC

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? FchUltVta { get; set; }                // FCH_ULTVTA

    [Column(TypeName = "numeric(18,6)")]
    public decimal? PendSurt { get; set; }                  // PEND_SURT

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Exist { get; set; }                     // EXIST

    [Column(TypeName = "numeric(18,6)")]
    public decimal? CostoProm { get; set; }                 // COSTO_PROM

    [Column(TypeName = "numeric(18,6)")]
    public decimal? UltCosto { get; set; }                  // ULT_COSTO

    public int? CveObs { get; set; }                        // CVE_OBS

    [Column(TypeName = "text")]
    public string? TipoEle { get; set; }                    // TIPO_ELE

    [Column(TypeName = "text")]
    public string? UniAlt { get; set; }                     // UNI_ALT

    [Column(TypeName = "numeric(18,6)")]
    public decimal? FacConv { get; set;  }                   // FAC_CONV

    public int? Apart { get; set; }                         // APART

    [Column(TypeName = "text")]
    public string? ConLote { get; set; }                    // CON_LOTE

    [Column(TypeName = "text")]
    public string? ConPedimento { get; set; }               // CON_PEDIMENTO

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Peso { get; set; }                      // PESO

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Volumen { get; set; }                   // VOLUMEN

    public int? CveEsqImpu { get; set; }                    // CVE_ESQIMPU

    [Column(TypeName = "numeric(18,6)")]
    public decimal? VtasAnlC { get; set; }                  // VTAS_ANL_C

    [Column(TypeName = "numeric(18,6)")]
    public decimal? VtasAnlM { get; set; }                  // VTAS_ANL_M

    [Column(TypeName = "numeric(18,6)")]
    public decimal? CompAnlC { get; set; }                  // COMP_ANL_C

    [Column(TypeName = "numeric(18,6)")]
    public decimal? CompAnlM { get; set; }                  // COMP_ANL_M

    [Column(TypeName = "text")]
    public string? CuentCont { get; set; }                  // CUENT_CONT

    [Column(TypeName = "text")]
    public string? BlkCstExt { get; set; }                  // BLK_CST_EXT

    [Column(TypeName = "text")]
    public string? Status { get; set; }                     // STATUS

    [Column(TypeName = "text")]
    public string? ManIeps { get; set; }                    // MAN_IEPS

    public int? AplManImp { get; set; }                     // APL_MAN_IMP

    [Column(TypeName = "numeric(18,6)")]
    public decimal? CuotaIeps { get; set; }                 // CUOTA_IEPS

    [Column(TypeName = "text")]
    public string? AplManIeps { get; set; }                 // APL_MAN_IEPS

    [Column(TypeName = "text")]
    public string? Uuid { get; set; }                       // UUID

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? VersionSinc { get; set; }              // VERSION_SINC

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? VersionSincFechaImg { get; set; }      // VERSION_SINC_FECHA_IMG

    [Column(TypeName = "text")]
    public string? CveProdserv { get; set; }                // CVE_PRODSERV

    [Column(TypeName = "text")]
    public string? CveUnidad { get; set; }                  // CVE_UNIDAD

    [Column(TypeName = "numeric(18,6)")]
    public decimal? LargoMl { get; set; }                   // LARGO_ML

    [Column(TypeName = "numeric(18,6)")]
    public decimal? AltoMl { get; set; }                    // ALTO_ML

    [Column(TypeName = "numeric(18,6)")]
    public decimal? AnchoMl { get; set; }                   // ANCHO_ML

    [Column(TypeName = "numeric(18,6)")]
    public decimal? FacUnidCce { get; set; }                // FAC_UNID_CCE
}
