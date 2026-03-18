using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Comssire.Models;

[Table("fb_proveedores")]
public class FbProveedor
{
    [Key]
    [Column(TypeName = "text")]
    public string Clave { get; set; } = default!;           // CLAVE

    [Column(TypeName = "text")]
    public string? Status { get; set; }                     // STATUS

    [Column(TypeName = "text")]
    public string? Nombre { get; set; }                     // NOMBRE

    [Column(TypeName = "text")]
    public string? Rfc { get; set; }                        // RFC

    [Column(TypeName = "text")]
    public string? Calle { get; set; }                      // CALLE

    public int? NumInt { get; set; }                        // NUMINT

    [Column(TypeName = "text")]
    public string? NumExt { get; set; }                     // NUMEXT

    [Column(TypeName = "text")]
    public string? Cruzamientos { get; set; }               // CRUZAMIENTOS

    [Column(TypeName = "text")]
    public string? Cruzamientos2 { get; set; }              // CRUZAMIENTOS2

    [Column(TypeName = "text")]
    public string? Colonia { get; set; }                    // COLONIA

    public int? Codigo { get; set; }                        // CODIGO

    [Column(TypeName = "text")]
    public string? Localidad { get; set; }                  // LOCALIDAD

    [Column(TypeName = "text")]
    public string? Municipio { get; set; }                  // MUNICIPIO

    [Column(TypeName = "text")]
    public string? Estado { get; set; }                     // ESTADO

    [Column(TypeName = "text")]
    public string? CvePais { get; set; }                    // CVE_PAIS

    [Column(TypeName = "text")]
    public string? Telefono { get; set; }                   // TELEFONO

    [Column(TypeName = "text")]
    public string? Clasific { get; set; }                   // CLASIFIC

    [Column(TypeName = "text")]
    public string? ConCredito { get; set; }                 // CON_CREDITO

    public int? DiasCred { get; set; }                      // DIASCRED

    [Column(TypeName = "numeric(18,6)")]
    public decimal? LimCred { get; set; }                   // LIMCRED

    [Column(TypeName = "text")]
    public string? UltPagoD { get; set; }                   // ULT_PAGOD

    [Column(TypeName = "numeric(18,6)")]
    public decimal? UltPagoM { get; set; }                  // ULT_PAGOM

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? UltPagoF { get; set; }                 // ULT_PAGOF

    public int? UltCompD { get; set; }                      // ULT_COMPD

    [Column(TypeName = "numeric(18,6)")]
    public decimal? UltCompM { get; set; }                  // ULT_COMPM

    [Column(TypeName = "timestamp without time zone")]
    public DateTime? UltCompF { get; set; }                 // ULT_COMPF

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Saldo { get; set; }                     // SALDO

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Ventas { get; set; }                    // VENTAS

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Descuento { get; set; }                 // DESCUENTO

    public int? TipTercero { get; set; }                    // TIP_TERCERO
    public int? TipOpera { get; set; }                      // TIP_OPERA

    public int? CveObs { get; set; }                        // CVE_OBS

    [Column(TypeName = "text")]
    public string? CuentaContable { get; set; }             // CUENTA_CONTABLE

    [Column(TypeName = "text")]
    public string? FormaPago { get; set; }                  // FORMA_PAGO

    [Column(TypeName = "text")]
    public string? Banco { get; set; }                      // BANCO

    [Column(TypeName = "text")]
    public string? DescOtros { get; set; }                  // DESC_OTROS

    [Column(TypeName = "text")]
    public string? Imprir { get; set; }                     // IMPRIR

    [Column(TypeName = "text")]
    public string? Mail { get; set; }                       // MAIL

    [Column(TypeName = "text")]
    public string? Enviosilen { get; set; }                 // ENVIOSILEN

    [Column(TypeName = "text")]
    public string? Emailpred { get; set; }                  // EMAILPRED

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Lat { get; set; }                       // LAT

    [Column(TypeName = "numeric(18,6)")]
    public decimal? Lon { get; set; }                       // LON
}
