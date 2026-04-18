using Comssire.Data;
using Comssire.Models;
using Comssire.Models.ComprasRemision;
using Comssire.Models.Firebird;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace Comssire.Services.ComprasRemision
{
    public class CompraRemisionPdfService
    {
        private readonly AppDbContext _db;

        public CompraRemisionPdfService(AppDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Genera un PDF con la información completa de la compra por nota de remisión:
        /// cabecera, proveedor, auditoría, partidas, repartos por almacén y totales.
        /// </summary>
        public async Task<byte[]> BuildCompraRemisionPdfAsync(Guid compraRemisionId)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var compra = await _db.ComprasRemision
                .AsNoTracking()
                .Include(c => c.Partidas)
                    .ThenInclude(p => p.Repartos)
                .Include(c => c.CreadoPor)
                .FirstOrDefaultAsync(c => c.Id == compraRemisionId);

            if (compra == null)
                throw new KeyNotFoundException("Compra por nota de remisión no encontrada.");

            var proveedor = await _db.FbProveedores
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Clave == compra.CveClpv);

            var clavesArt = compra.Partidas
                .Select(p => p.CveArt)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToList();

            var productos = await _db.FbProductos
                .AsNoTracking()
                .Where(p => clavesArt.Contains(p.CveArt))
                .ToDictionaryAsync(p => p.CveArt, p => p);

            var numsAlm = compra.Partidas
                .SelectMany(p => p.Repartos)
                .Select(r => r.NumAlm)
                .Distinct()
                .ToList();

            var almacenes = await _db.FbAlmacenes
                .AsNoTracking()
                .Where(a => numsAlm.Contains(a.CveAlm))
                .ToDictionaryAsync(a => a.CveAlm, a => a);

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

            var culture = new CultureInfo("es-MX");
            string Money(decimal v) => v.ToString("C2", culture);
            string Num(decimal v) => v.ToString("0.##", culture);

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
                                row.RelativeColumn().Column(s =>
                                {
                                    s.Item().Text("COMSSIRE - Compra por Nota de Remisión").FontSize(16).Bold();
                                    s.Item().Text($"ID: {compra.Id}").FontSize(9).FontColor(Colors.Grey.Darken2);
                                });

                                row.ConstantColumn(230).AlignRight().Column(s =>
                                {
                                    s.Item().Text($"Folio remisión: {compra.FolioRemision}").Bold();
                                    s.Item().Text($"Fecha: {compra.Fecha:yyyy-MM-dd HH:mm} UTC").FontSize(9);
                                    s.Item().Text($"Almacén default: {compra.NumAlmaDefault}").FontSize(9);
                                });
                            });

                            col.Item().PaddingTop(6).LineHorizontal(1);
                        });
                    });

                    page.Content().PaddingVertical(10).Column(stack =>
                    {
                        stack.Item().Element(section =>
                        {
                            section.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(s =>
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

                                var direccion = BuildDireccionProveedor(proveedor);
                                if (!string.IsNullOrWhiteSpace(direccion))
                                    s.Item().Text($"Dirección: {direccion}");
                            });
                        });

                        stack.Item().PaddingTop(10).Element(section =>
                        {
                            section.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(s =>
                            {
                                s.Item().Text("Auditoría").Bold();

                                s.Item().Row(r =>
                                {
                                    r.RelativeColumn().Text($"Creado: {compra.CreatedAt:yyyy-MM-dd HH:mm} UTC");
                                    r.RelativeColumn().Text($"Por: {compra.CreadoPor?.Username ?? compra.CreadoPorUserId.ToString()}");
                                });

                                if (compra.UpdatedAt.HasValue)
                                {
                                    s.Item().Row(r =>
                                    {
                                        r.RelativeColumn().Text($"Actualizado: {compra.UpdatedAt.Value:yyyy-MM-dd HH:mm} UTC");
                                        r.RelativeColumn().Text(string.Empty);
                                    });
                                }

                                if (compra.ModGeneradoAt.HasValue || compra.ModConsecutivo.HasValue)
                                {
                                    s.Item().Row(r =>
                                    {
                                        r.RelativeColumn().Text($"MOD generado: {(compra.ModGeneradoAt.HasValue ? compra.ModGeneradoAt.Value.ToString("yyyy-MM-dd HH:mm") + " UTC" : "—")}");
                                        r.RelativeColumn().Text($"Consecutivo: {(compra.ModConsecutivo?.ToString() ?? "—")}");
                                    });
                                }

                                if (!string.IsNullOrWhiteSpace(compra.Observaciones))
                                    s.Item().PaddingTop(4).Text($"Observaciones: {compra.Observaciones}");
                            });
                        });

                        stack.Item().PaddingTop(14).Text("Partidas").FontSize(12).Bold();

                        stack.Item().Element(e =>
                        {
                            e.Table(t =>
                            {
                                t.ColumnsDefinition(cols =>
                                {
                                    cols.ConstantColumn(80); // Clave
                                    cols.RelativeColumn(3);  // Descripción
                                    cols.ConstantColumn(55); // Unidad
                                    cols.ConstantColumn(60); // Cant
                                    cols.ConstantColumn(70); // Costo
                                    cols.ConstantColumn(70); // Precio
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
                                    h.Cell().Element(CellHeader).AlignRight().Text("Precio");
                                    h.Cell().Element(CellHeader).AlignRight().Text("IVA%");
                                    h.Cell().Element(CellHeader).AlignRight().Text("Importe");

                                    static IContainer CellHeader(IContainer c) =>
                                        c.Background(Colors.Grey.Lighten3).Padding(6).DefaultTextStyle(x => x.Bold());
                                });

                                foreach (var p in compra.Partidas)
                                {
                                    productos.TryGetValue(p.CveArt, out var prod);
                                    var descr = string.IsNullOrWhiteSpace(p.Descripcion)
                                        ? (prod?.Descr ?? "—")
                                        : p.Descripcion;

                                    var importe = p.CantTotal * p.CostoUnitario;

                                    t.Cell().Element(CellBody).Text(p.CveArt);
                                    t.Cell().Element(CellBody).Text(descr);
                                    t.Cell().Element(CellBody).Text(p.UniVenta);
                                    t.Cell().Element(CellBody).AlignRight().Text(Num(p.CantTotal));
                                    t.Cell().Element(CellBody).AlignRight().Text(Money(p.CostoUnitario));
                                    t.Cell().Element(CellBody).AlignRight().Text(Money(p.PrecioUnitario));
                                    t.Cell().Element(CellBody).AlignRight().Text(Num(p.IvaPct));
                                    t.Cell().Element(CellBody).AlignRight().Text(Money(importe));

                                    if (p.Repartos != null && p.Repartos.Count > 0)
                                    {
                                        var repartoTxt = string.Join(" | ", p.Repartos
                                            .OrderBy(r => r.NumAlm)
                                            .Select(r =>
                                            {
                                                almacenes.TryGetValue(r.NumAlm, out var alm);
                                                var almDescr = alm?.Descr ?? string.Empty;
                                                return string.IsNullOrWhiteSpace(almDescr)
                                                    ? $"{r.NumAlm}: {Num(r.Cant)}"
                                                    : $"{r.NumAlm} ({almDescr}): {Num(r.Cant)}";
                                            }));

                                        t.Cell().ColumnSpan(8).Element(c =>
                                            c.PaddingLeft(10)
                                             .PaddingBottom(6)
                                             .Text($"Reparto: {repartoTxt}")
                                             .FontSize(9)
                                             .FontColor(Colors.Grey.Darken2));
                                    }

                                    if (!string.IsNullOrWhiteSpace(p.Observaciones))
                                    {
                                        t.Cell().ColumnSpan(8).Element(c =>
                                            c.PaddingLeft(10)
                                             .PaddingBottom(6)
                                             .Text($"Obs partida: {p.Observaciones}")
                                             .FontSize(9)
                                             .FontColor(Colors.Grey.Darken2));
                                    }
                                }

                                static IContainer CellBody(IContainer c) =>
                                    c.BorderBottom(1).BorderColor(Colors.Grey.Lighten2)
                                     .PaddingVertical(6).PaddingHorizontal(6);
                            });
                        });

                        stack.Item().PaddingTop(12).AlignRight().Element(tot =>
                        {
                            tot.Border(1).BorderColor(Colors.Grey.Lighten2)
                               .Padding(10).Width(280)
                               .Column(s =>
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
