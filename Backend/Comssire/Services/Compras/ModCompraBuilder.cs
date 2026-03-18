using System.Globalization;
using System.Text;
using System.Xml.Linq;
using Comssire.Models.Compras;

namespace Comssire.Services.Compras
{
    public static class ModCompraBuilder
    {
        public static byte[] Build(Compra compra)
        {
            var inv = CultureInfo.InvariantCulture;

            static string S(string? v) => v ?? "";

            static string Trunc(string v, int max) =>
                string.IsNullOrEmpty(v) ? "" : (v.Length > max ? v[..max] : v);

            // =========================
            // METADATA (dtfield con 35 campos, ORDEN Aspel)
            // =========================
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

                            // ✅ ORDEN Aspel: primero REG_KITPROD/NUM_REG, luego COSTO
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
                            new XElement("FIELD", new XAttribute("attrname", "LOTE"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "20")),
                            new XElement("FIELD", new XAttribute("attrname", "PEDIMENTO"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "21")),
                            new XElement("FIELD", new XAttribute("attrname", "FECHCADUC"), new XAttribute("fieldtype", "dateTime")),
                            new XElement("FIELD", new XAttribute("attrname", "FECHADUANA"), new XAttribute("fieldtype", "dateTime")),
                            new XElement("FIELD", new XAttribute("attrname", "CVE_PRODSERV"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "16")),
                            new XElement("FIELD", new XAttribute("attrname", "CVE_UNIDAD"), new XAttribute("fieldtype", "string"), new XAttribute("WIDTH", "10"))
                        )
                    )
                )
            );

            // =========================
            // ROWDATA (cabecera)
            // =========================
            var numMoned = 1;
            var tipCamb = 1m;

            // ✅ SU_REFER (Ref. Prov) = FOLIO|YYYY-MM-DD, MAX 20
            // Importante: preservar la fecha completa y recortar el folio si es necesario.
            var folio = (compra.FolioFactura ?? "").Trim();
            var fechaStr = compra.Fecha.ToString("yyyy-MM-dd", inv); // ✅ con guiones
            var maxFolioLen = 20 - (1 + fechaStr.Length); // 20 - 11 = 9
            if (maxFolioLen < 0) maxFolioLen = 0;

            var folioRec = Trunc(folio, maxFolioLen);
            var suRefer = $"{folioRec}|{fechaStr}"; // ✅ sin '|' extra al final

            // Observaciones (mantén folio limpio + observaciones)
            var obs = S(compra.Observaciones);
            if (!string.IsNullOrWhiteSpace(folio))
            {
                var prefix = $"Factura: {folio}";
                obs = string.IsNullOrWhiteSpace(obs) ? prefix : $"{prefix}\n{obs}";
            }
            obs = Trunc(obs, 255);

            var row = new XElement("ROW",
                new XAttribute("CVE_CLPV", Trunc(compra.CveClpv ?? "", 10)),
                new XAttribute("NUM_ALMA", compra.NumAlmaDefault.ToString(inv)),
                new XAttribute("ESQUEMA", "1"),
                new XAttribute("DES_TOT", "0"),
                new XAttribute("DES_FIN", "0"),
                new XAttribute("NUM_MONED", numMoned.ToString(inv)),
                new XAttribute("TIPCAMB", tipCamb.ToString(inv)),
                new XAttribute("STR_OBS", obs),
                new XAttribute("ENTREGA", ""),
                new XAttribute("SU_REFER", suRefer),
                new XAttribute("TOT_IND", "0"),
                new XAttribute("MODULO", "COMP")
            );

            // =========================
            // dtfield (detalle)
            // =========================
            var dtfield = new XElement("dtfield");

            foreach (var p in compra.Partidas)
            {
                var uni = string.IsNullOrWhiteSpace(p.UniVenta) ? "PZ" : p.UniVenta.ToUpperInvariant();
                uni = Trunc(uni, 10);

                var obsPart = Trunc(S(p.Observaciones), 255);

                void AddDetalle(decimal cant, int numAlm)
                {
                    dtfield.Add(new XElement("ROWdtfield",
                        new XAttribute("CANT", cant.ToString(inv)),
                        new XAttribute("CVE_ART", Trunc(p.CveArt ?? "", 20)),

                        new XAttribute("DESC1", "0"),

                        new XAttribute("IMPU1", "0"),
                        new XAttribute("IMPU2", "0"),
                        new XAttribute("IMPU3", "0"),
                        new XAttribute("IMPU4", p.IvaPct.ToString(inv)),

                        new XAttribute("PREC", "0"),
                        new XAttribute("NUM_ALM", numAlm.ToString(inv)),
                        new XAttribute("STR_OBS", obsPart),
                        new XAttribute("REG_GPOPROD", "0"),

                        new XAttribute("COSTO", p.CostoUnitario.ToString(inv)),
                        new XAttribute("TIPO_PROD", "P"),
                        new XAttribute("TIPO_ELEM", "N"),
                        new XAttribute("MINDIRECTO", "0"),
                        new XAttribute("TIP_CAM", tipCamb.ToString(inv)),
                        new XAttribute("FACT_CONV", "1"),
                        new XAttribute("UNI_VENTA", uni),

                        new XAttribute("IMP1APLA", "6"),
                        new XAttribute("IMP2APLA", "6"),
                        new XAttribute("IMP3APLA", "6"),
                        new XAttribute("IMP4APLA", "0"),
                        new XAttribute("PREC_SINREDO", "0"),
                        new XAttribute("COST_SINREDO", p.CostoUnitario.ToString(inv))
                    ));
                }

                if (p.Repartos != null && p.Repartos.Count > 0)
                {
                    foreach (var r in p.Repartos)
                        AddDetalle(r.Cant, r.NumAlm);
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
