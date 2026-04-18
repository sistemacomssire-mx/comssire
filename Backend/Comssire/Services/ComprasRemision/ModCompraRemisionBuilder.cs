using System.Globalization;
using System.Text;
using System.Xml.Linq;
using Comssire.Models.ComprasRemision;

namespace Comssire.Services.ComprasRemision
{
    public static class ModCompraRemisionBuilder
    {
        public static byte[] Build(CompraRemision compra)
        {
            var inv = CultureInfo.InvariantCulture;

            static string S(string? v) => v?.Trim() ?? string.Empty;

            static string Trunc(string? v, int max)
            {
                var value = S(v);
                if (string.IsNullOrEmpty(value)) return string.Empty;
                return value.Length <= max ? value : value[..max];
            }

            static string Dec(decimal value)
                => value.ToString("0.####", CultureInfo.InvariantCulture);

            // =============================================
            // METADATA
            // Se deja alineado al archivo PruebaRecepcion.mod
            // =============================================
            var metadata = new XElement("METADATA",
                new XElement("FIELDS",
                    new XElement("FIELD", new XAttribute("attrname", "CVE_CLPV"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "10")),
                    new XElement("FIELD", new XAttribute("attrname", "NUM_ALMA"), new XAttribute("fieldtype", "i4")),
                    new XElement("FIELD", new XAttribute("attrname", "CVE_PEDI"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "20")),
                    new XElement("FIELD", new XAttribute("attrname", "ESQUEMA"), new XAttribute("fieldtype", "i4")),
                    new XElement("FIELD", new XAttribute("attrname", "DES_TOT"), new XAttribute("fieldtype", "r8")),
                    new XElement("FIELD", new XAttribute("attrname", "DES_FIN"), new XAttribute("fieldtype", "r8")),
                    new XElement("FIELD", new XAttribute("attrname", "CVE_VEND"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "5")),
                    new XElement("FIELD", new XAttribute("attrname", "COM_TOT"), new XAttribute("fieldtype", "r8")),
                    new XElement("FIELD", new XAttribute("attrname", "NUM_MONED"), new XAttribute("fieldtype", "i4")),
                    new XElement("FIELD", new XAttribute("attrname", "TIPCAMB"), new XAttribute("fieldtype", "r8")),
                    new XElement("FIELD", new XAttribute("attrname", "STR_OBS"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "255")),
                    new XElement("FIELD", new XAttribute("attrname", "ENTREGA"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "25")),
                    new XElement("FIELD", new XAttribute("attrname", "SU_REFER"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "20")),
                    new XElement("FIELD", new XAttribute("attrname", "TOT_IND"), new XAttribute("fieldtype", "r8")),
                    new XElement("FIELD", new XAttribute("attrname", "MODULO"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "4")),
                    new XElement("FIELD", new XAttribute("attrname", "CONDICION"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "25")),

                    new XElement("FIELD", new XAttribute("attrname", "dtfield"), new XAttribute("fieldtype", "nested"),
                        new XElement("FIELDS",
                            new XElement("FIELD", new XAttribute("attrname", "CANT"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "CVE_ART"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "20")),
                            new XElement("FIELD", new XAttribute("attrname", "DESC1"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "DESC2"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "DESC3"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "IMPU1"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "IMPU2"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "IMPU3"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "IMPU4"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "COMI"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "PREC"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "NUM_ALM"), new XAttribute("fieldtype", "i4")),
                            new XElement("FIELD", new XAttribute("attrname", "STR_OBS"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "255")),
                            new XElement("FIELD", new XAttribute("attrname", "REG_GPOPROD"), new XAttribute("fieldtype", "i4")),
                            new XElement("FIELD", new XAttribute("attrname", "REG_KITPROD"), new XAttribute("fieldtype", "i4")),
                            new XElement("FIELD", new XAttribute("attrname", "NUM_REG"), new XAttribute("fieldtype", "i4")),
                            new XElement("FIELD", new XAttribute("attrname", "COSTO"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "TIPO_PROD"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "1")),
                            new XElement("FIELD", new XAttribute("attrname", "TIPO_ELEM"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "1")),
                            new XElement("FIELD", new XAttribute("attrname", "MINDIRECTO"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "TIP_CAM"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "FACT_CONV"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "UNI_VENTA"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "10")),
                            new XElement("FIELD", new XAttribute("attrname", "IMP1APLA"), new XAttribute("fieldtype", "i4")),
                            new XElement("FIELD", new XAttribute("attrname", "IMP2APLA"), new XAttribute("fieldtype", "i4")),
                            new XElement("FIELD", new XAttribute("attrname", "IMP3APLA"), new XAttribute("fieldtype", "i4")),
                            new XElement("FIELD", new XAttribute("attrname", "IMP4APLA"), new XAttribute("fieldtype", "i4")),
                            new XElement("FIELD", new XAttribute("attrname", "PREC_SINREDO"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "COST_SINREDO"), new XAttribute("fieldtype", "r8")),
                            new XElement("FIELD", new XAttribute("attrname", "LOTE"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "16")),
                            new XElement("FIELD", new XAttribute("attrname", "PEDIMENTO"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "16")),
                            new XElement("FIELD", new XAttribute("attrname", "FECHCADUC"), new XAttribute("fieldtype", "dateTime")),
                            new XElement("FIELD", new XAttribute("attrname", "FECHADUANA"), new XAttribute("fieldtype", "dateTime")),
                            new XElement("FIELD", new XAttribute("attrname", "CVE_PRODSERV"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "9")),
                            new XElement("FIELD", new XAttribute("attrname", "CVE_UNIDAD"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "4"))
                        ),
                        new XElement("PARAMS")
                    )
                ),
                new XElement("PARAMS")
            );

            // =============================================
            // CABECERA
            // =============================================
            var row = new XElement("ROW",
                new XAttribute("CVE_CLPV", Trunc(compra.CveClpv, 10)),
                new XAttribute("NUM_ALMA", compra.NumAlmaDefault.ToString(inv)),
                new XAttribute("ESQUEMA", "0"),
                new XAttribute("DES_TOT", "0"),
                new XAttribute("DES_FIN", "0"),
                new XAttribute("NUM_MONED", "1"),
                new XAttribute("TIPCAMB", "1"),
                new XAttribute("STR_OBS", Trunc(compra.Observaciones, 255)),
                new XAttribute("ENTREGA", ""),
                new XAttribute("SU_REFER", Trunc(compra.FolioRemision, 20)),
                new XAttribute("TOT_IND", "0"),
                new XAttribute("MODULO", "COMP")
            );

            // =============================================
            // DETALLE
            // Regla de captura indicada por negocio:
            // - Producto: 16
            // - Descripción: 40
            // En el .mod de muestra no existe campo Descripción.
            // Por eso Descripcion se conserva a nivel entidad/PDF y aquí,
            // solo si no hay observaciones, se puede usar como STR_OBS.
            // =============================================
            var dtfield = new XElement("dtfield");

            foreach (var p in compra.Partidas.OrderBy(x => x.CveArt))
            {
                var cveArt = Trunc(p.CveArt, 16);
                var uniVenta = Trunc(string.IsNullOrWhiteSpace(p.UniVenta) ? "PZ" : p.UniVenta.ToLowerInvariant(), 10);

                var detalleObs = !string.IsNullOrWhiteSpace(p.Observaciones)
                    ? Trunc(p.Observaciones, 255)
                    : string.Empty;

                void AddDetalle(decimal cant, int numAlm)
                {
                    dtfield.Add(new XElement("ROWdtfield",
                        new XAttribute("CANT", Dec(cant)),
                        new XAttribute("CVE_ART", cveArt),
                        new XAttribute("DESC1", "0"),
                        new XAttribute("IMPU1", "0"),
                        new XAttribute("IMPU2", "0"),
                        new XAttribute("IMPU3", "0"),
                        new XAttribute("IMPU4", Dec(p.IvaPct)),
                        new XAttribute("PREC", Dec(p.PrecioUnitario)),
                        new XAttribute("NUM_ALM", numAlm.ToString(inv)),
                        new XAttribute("STR_OBS", detalleObs),
                        new XAttribute("REG_GPOPROD", "0"),
                        new XAttribute("COSTO", Dec(p.CostoUnitario)),
                        new XAttribute("TIPO_PROD", "P"),
                        new XAttribute("TIPO_ELEM", "N"),
                        new XAttribute("MINDIRECTO", "0"),
                        new XAttribute("TIP_CAM", "1"),
                        new XAttribute("FACT_CONV", "1"),
                        new XAttribute("UNI_VENTA", uniVenta),
                        new XAttribute("IMP1APLA", "6"),
                        new XAttribute("IMP2APLA", "6"),
                        new XAttribute("IMP3APLA", "6"),
                        new XAttribute("IMP4APLA", "0"),
                        new XAttribute("PREC_SINREDO", Dec(p.PrecioUnitario)),
                        new XAttribute("COST_SINREDO", Dec(p.CostoUnitario))
                    ));
                }

                if (p.Repartos != null && p.Repartos.Count > 0)
                {
                    foreach (var r in p.Repartos.Where(x => x.Cant > 0))
                    {
                        AddDetalle(r.Cant, r.NumAlm);
                    }
                }
                else
                {
                    AddDetalle(p.CantTotal, compra.NumAlmaDefault);
                }
            }

            row.Add(dtfield);

            var doc = new XDocument(
                new XDeclaration("1.0", "utf-8", "yes"),
                new XElement("DATAPACKET",
                    new XAttribute("Version", "2.0"),
                    metadata,
                    new XElement("ROWDATA", row)
                )
            );

            var xml = doc.ToString(SaveOptions.DisableFormatting);
            return Encoding.UTF8.GetBytes(xml);
        }
    }
}
