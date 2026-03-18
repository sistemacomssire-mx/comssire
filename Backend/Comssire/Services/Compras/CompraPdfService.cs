using System.Globalization;
using Comssire.Data;
using Comssire.Models;
using Comssire.Models.Compras;
using Comssire.Models.Firebird;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Comssire.Services.Compras
{
    public class CompraPdfService
    {
        private readonly AppDbContext _db;

        public CompraPdfService(AppDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Genera un PDF (bytes) con absolutamente toda la información de la compra:
        /// cabecera, proveedor, auditoría, partidas, repartos por almacén, impuestos y totales.
        /// </summary>
        public async Task<byte[]> BuildCompraPdfAsync(Guid compraId)
        {
            // QuestPDF Community
            QuestPDF.Settings.License = LicenseType.Community;

            // 1) Traer compra con todo lo relacionado
            var compra = await _db.Compras
                .AsNoTracking()
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .Include(c => c.CreadoPor)
                .Include(c => c.EnviadoPor)
                .Include(c => c.AprobadoPor)
                .Include(c => c.RechazadoPor)
                .FirstOrDefaultAsync(c => c.Id == compraId);

            if (compra == null)
                throw new KeyNotFoundException("Compra no encontrada.");

            // 2) Traer proveedor espejo Firebird (en tu modelo está en Comssire.Models y se llama FbProveedor)
            var proveedor = await _db.FbProveedores
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Clave == compra.CveClpv);

            // 3) Precargar productos (espejo Firebird)
            var clavesArt = compra.Partidas
                .Select(p => p.CveArt)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToList();

            var productos = await _db.FbProductos
                .AsNoTracking()
                .Where(p => clavesArt.Contains(p.CveArt))
                .ToDictionaryAsync(p => p.CveArt, p => p);

            // 4) Precargar almacenes (espejo Firebird) para traducir NumAlm -> descripción
            var numsAlm = compra.Partidas
                .SelectMany(p => p.Repartos)
                .Select(r => r.NumAlm)
                .Distinct()
                .ToList();

            var almacenes = await _db.FbAlmacenes
                .AsNoTracking()
                .Where(a => numsAlm.Contains(a.CveAlm))
                .ToDictionaryAsync(a => a.CveAlm, a => a);

            // 5) Cálculos (subtotal, iva, total) desde tus campos reales:
            // CantTotal, CostoUnitario, IvaPct
            decimal subtotal = 0m;
            decimal ivaTotal = 0m;

            foreach (var p in compra.Partidas)
            {
                var importe = p.CantTotal * p.CostoUnitario;
                var iva = importe * (p.IvaPct / 100m);

                subtotal += importe;
                ivaTotal += iva;
            }

            decimal total = subtotal + ivaTotal;

            // Helpers formato
            var culture = new CultureInfo("es-MX");
            string Money(decimal v) => v.ToString("C2", culture);
            string Num(decimal v) => v.ToString("0.##", culture);

            // 6) Construcción del PDF
            var doc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.Letter);
                    page.Margin(25);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(header =>
                    {
                        header.Column(col =>
                        {
                            col.Item().Row(row =>
                            {
                                row.RelativeColumn().Stack(s =>
                                {
                                    s.Item().Text("COMSSIRE - Compra").FontSize(16).Bold();
                                    s.Item().Text($"ID Compra: {compra.Id}").FontSize(9).FontColor(Colors.Grey.Darken2);
                                    s.Item().Text($"Estado: {compra.Estado}").FontSize(9).FontColor(Colors.Grey.Darken2);
                                });

                                row.ConstantColumn(230).AlignRight().Stack(s =>
                                {
                                    s.Item().Text($"Folio factura: {compra.FolioFactura}").Bold();
                                    s.Item().Text($"Fecha: {compra.Fecha:yyyy-MM-dd HH:mm} UTC").FontSize(9);
                                    s.Item().Text($"Almacén default: {compra.NumAlmaDefault}").FontSize(9);
                                });
                            });

                            col.Item().PaddingTop(6).LineHorizontal(1);
                        });
                    });

                    page.Content().PaddingVertical(10).Stack(stack =>
                    {
                        // ===== Proveedor =====
                        stack.Item().Element(section =>
                        {
                            section.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Stack(s =>
                            {
                                s.Item().Text("Proveedor").Bold();

                                s.Item().Row(r =>
                                {
                                    r.RelativeColumn().Text($"Clave: {compra.CveClpv}");
                                    r.RelativeColumn().Text($"Nombre: {proveedor?.Nombre ?? "N/D"}");
                                });

                                s.Item().Row(r =>
                                {
                                    r.RelativeColumn().Text($"RFC: {proveedor?.Rfc ?? "N/D"}");
                                    r.RelativeColumn().Text($"Teléfono: {proveedor?.Telefono ?? "N/D"}");
                                });

                                // Dirección (si existe)
                                var direccion = BuildDireccionProveedor(proveedor);
                                if (!string.IsNullOrWhiteSpace(direccion))
                                    s.Item().Text($"Dirección: {direccion}");
                            });
                        });

                        // ===== Auditoría / flujo =====
                        stack.Item().PaddingTop(10).Element(section =>
                        {
                            section.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Stack(s =>
                            {
                                s.Item().Text("Auditoría").Bold();

                                s.Item().Row(r =>
                                {
                                    r.RelativeColumn().Text($"Creado: {compra.CreatedAt:yyyy-MM-dd HH:mm} UTC");
                                    r.RelativeColumn().Text($"Por: {compra.CreadoPor?.Username ?? compra.CreadoPorUserId.ToString()}");
                                });

                                s.Item().Row(r =>
                                {
                                    r.RelativeColumn().Text($"Enviado: {(compra.EnviadoAt.HasValue ? compra.EnviadoAt.Value.ToString("yyyy-MM-dd HH:mm") + " UTC" : "—")}");
                                    r.RelativeColumn().Text($"Por: {(compra.EnviadoPor != null ? compra.EnviadoPor.Username : (compra.EnviadoPorUserId?.ToString() ?? "—"))}");
                                });

                                s.Item().Row(r =>
                                {
                                    r.RelativeColumn().Text($"Aprobado: {(compra.AprobadoAt.HasValue ? compra.AprobadoAt.Value.ToString("yyyy-MM-dd HH:mm") + " UTC" : "—")}");
                                    r.RelativeColumn().Text($"Por: {(compra.AprobadoPor != null ? compra.AprobadoPor.Username : (compra.AprobadoPorUserId?.ToString() ?? "—"))}");
                                });

                                s.Item().Row(r =>
                                {
                                    r.RelativeColumn().Text($"Rechazado: {(compra.RechazadoAt.HasValue ? compra.RechazadoAt.Value.ToString("yyyy-MM-dd HH:mm") + " UTC" : "—")}");
                                    r.RelativeColumn().Text($"Por: {(compra.RechazadoPor != null ? compra.RechazadoPor.Username : (compra.RechazadoPorUserId?.ToString() ?? "—"))}");
                                });

                                if (!string.IsNullOrWhiteSpace(compra.MotivoRechazo))
                                    s.Item().PaddingTop(4).Text($"Motivo rechazo: {compra.MotivoRechazo}");

                                if (!string.IsNullOrWhiteSpace(compra.Observaciones))
                                    s.Item().PaddingTop(4).Text($"Observaciones: {compra.Observaciones}");
                            });
                        });

                        // ===== Partidas =====
                        stack.Item().PaddingTop(14).Text("Partidas").FontSize(12).Bold();

                        stack.Item().Element(e =>
                        {
                            e.Table(t =>
                            {
                                t.ColumnsDefinition(cols =>
                                {
                                    cols.ConstantColumn(70); // Clave
                                    cols.RelativeColumn(3);  // Descripción
                                    cols.ConstantColumn(55); // Unidad
                                    cols.ConstantColumn(60); // Cant
                                    cols.ConstantColumn(70); // Costo
                                    cols.ConstantColumn(55); // IVA%
                                    cols.ConstantColumn(80); // Importe
                                });

                                t.Header(h =>
                                {
                                    h.Cell().Element(CellHeader).Text("Clave");
                                    h.Cell().Element(CellHeader).Text("Descripción");
                                    h.Cell().Element(CellHeader).Text("Uni");
                                    h.Cell().Element(CellHeader).AlignRight().Text("Cant");
                                    h.Cell().Element(CellHeader).AlignRight().Text("Costo");
                                    h.Cell().Element(CellHeader).AlignRight().Text("IVA%");
                                    h.Cell().Element(CellHeader).AlignRight().Text("Importe");

                                    static IContainer CellHeader(IContainer c) =>
                                        c.Background(Colors.Grey.Lighten3).Padding(6).DefaultTextStyle(x => x.Bold());
                                });

                                foreach (var p in compra.Partidas)
                                {
                                    productos.TryGetValue(p.CveArt, out var prod);
                                    var descr = prod?.Descr ?? "—";

                                    var importe = p.CantTotal * p.CostoUnitario;

                                    t.Cell().Element(CellBody).Text(p.CveArt);
                                    t.Cell().Element(CellBody).Text(descr);
                                    t.Cell().Element(CellBody).Text(p.UniVenta);
                                    t.Cell().Element(CellBody).AlignRight().Text(Num(p.CantTotal));
                                    t.Cell().Element(CellBody).AlignRight().Text(Money(p.CostoUnitario));
                                    t.Cell().Element(CellBody).AlignRight().Text(Num(p.IvaPct));
                                    t.Cell().Element(CellBody).AlignRight().Text(Money(importe));

                                    // Repartos por almacén debajo
                                    if (p.Repartos != null && p.Repartos.Count > 0)
                                    {
                                        var repartoTxt = string.Join(" | ", p.Repartos
                                            .OrderBy(r => r.NumAlm)
                                            .Select(r =>
                                            {
                                                almacenes.TryGetValue(r.NumAlm, out var alm);
                                                var almDescr = alm?.Descr ?? "";
                                                return string.IsNullOrWhiteSpace(almDescr)
                                                    ? $"{r.NumAlm}: {Num(r.Cant)}"
                                                    : $"{r.NumAlm} ({almDescr}): {Num(r.Cant)}";
                                            }));

                                        t.Cell().ColumnSpan(7).Element(c =>
                                            c.PaddingLeft(10)
                                             .PaddingBottom(6)
                                             .Text($"Reparto: {repartoTxt}")
                                             .FontSize(9)
                                             .FontColor(Colors.Grey.Darken2));

                                        if (!string.IsNullOrWhiteSpace(p.Observaciones))
                                        {
                                            t.Cell().ColumnSpan(7).Element(c =>
                                                c.PaddingLeft(10)
                                                 .PaddingBottom(6)
                                                 .Text($"Obs partida: {p.Observaciones}")
                                                 .FontSize(9)
                                                 .FontColor(Colors.Grey.Darken2));
                                        }
                                    }
                                    else
                                    {
                                        if (!string.IsNullOrWhiteSpace(p.Observaciones))
                                        {
                                            t.Cell().ColumnSpan(7).Element(c =>
                                                c.PaddingLeft(10)
                                                 .PaddingBottom(6)
                                                 .Text($"Obs partida: {p.Observaciones}")
                                                 .FontSize(9)
                                                 .FontColor(Colors.Grey.Darken2));
                                        }
                                    }
                                }

                                static IContainer CellBody(IContainer c) =>
                                    c.BorderBottom(1).BorderColor(Colors.Grey.Lighten2)
                                     .PaddingVertical(6).PaddingHorizontal(6);
                            });
                        });

                        // ===== Totales =====
                        stack.Item().PaddingTop(12).AlignRight().Element(tot =>
                        {
                            tot.Border(1).BorderColor(Colors.Grey.Lighten2)
                               .Padding(10).Width(260)
                               .Stack(s =>
                               {
                                   s.Item().Row(r =>
                                   {
                                       r.RelativeColumn().Text("Subtotal:").Bold();
                                       r.ConstantColumn(120).AlignRight().Text(Money(subtotal));
                                   });

                                   s.Item().Row(r =>
                                   {
                                       r.RelativeColumn().Text("IVA total:").Bold();
                                       r.ConstantColumn(120).AlignRight().Text(Money(ivaTotal));
                                   });

                                   s.Item().LineHorizontal(1);

                                   s.Item().Row(r =>
                                   {
                                       r.RelativeColumn().Text("Total:").FontSize(12).Bold();
                                       r.ConstantColumn(120).AlignRight().Text(Money(total)).FontSize(12).Bold();
                                   });
                               });
                        });
                    });

                    page.Footer().AlignRight().Text(x =>
                    {
                        x.Span("Generado por COMSSIRE • ");
                        x.Span(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")).SemiBold();
                        x.Span(" UTC");
                    });
                });
            });

            return doc.GeneratePdf();
        }

        private static string BuildDireccionProveedor(FbProveedor? p)
        {
            if (p == null) return string.Empty;

            // Ej: Calle NumExt NumInt, Colonia, Municipio, Estado, CP
            var parts = new List<string>();

            var calle = p.Calle?.Trim();
            if (!string.IsNullOrWhiteSpace(calle))
            {
                var num = new List<string>();
                if (!string.IsNullOrWhiteSpace(p.NumExt)) num.Add($"No. {p.NumExt}");
                if (p.NumInt.HasValue) num.Add($"Int. {p.NumInt.Value}");
                var comp = num.Count > 0 ? $"{calle} ({string.Join(" ", num)})" : calle;
                parts.Add(comp);
            }

            if (!string.IsNullOrWhiteSpace(p.Colonia)) parts.Add(p.Colonia.Trim());
            if (!string.IsNullOrWhiteSpace(p.Municipio)) parts.Add(p.Municipio.Trim());
            if (!string.IsNullOrWhiteSpace(p.Estado)) parts.Add(p.Estado.Trim());
            if (p.Codigo.HasValue) parts.Add($"CP {p.Codigo.Value}");

            return string.Join(", ", parts);
        }
    }
}