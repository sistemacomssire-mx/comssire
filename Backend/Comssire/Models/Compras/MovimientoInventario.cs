using System.ComponentModel.DataAnnotations;

namespace Comssire.Models.Compras
{
    /// <summary>
    /// Movimiento de inventario interno de tu sistema (Postgres).
    /// 
    /// Este NO es el inventario de SAE, es el tuyo.
    /// 
    /// Regla:
    /// - Cuando el admin aprueba una compra, se generan movimientos tipo ENTRADA_COMPRA
    ///   por cada reparto (artículo + almacén + cantidad).
    /// 
    /// Esto te permite:
    /// - Consultar existencias internas
    /// - Auditar entradas por compra/factura
    /// - Reconstruir inventario por historial
    /// </summary>
    public class MovimientoInventario
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Fecha del movimiento (usamos la fecha de la compra).
        /// </summary>
        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Tipo de movimiento interno.
        /// Para este módulo solo usaremos "ENTRADA_COMPRA".
        /// (Si luego haces salidas/traspasos, agregas más tipos.)
        /// </summary>
        [Required, MaxLength(30)]
        public string Tipo { get; set; } = "ENTRADA_COMPRA";

        /// <summary>
        /// Referencia del movimiento (folio factura).
        /// </summary>
        [Required, MaxLength(30)]
        public string Referencia { get; set; } = string.Empty;

        /// <summary>
        /// Compra origen (para auditoría).
        /// </summary>
        public Guid CompraId { get; set; }

        /// <summary>
        /// Producto (CVE_ART).
        /// </summary>
        [Required, MaxLength(20)]
        public string CveArt { get; set; } = string.Empty;

        /// <summary>
        /// Almacén (NUM_ALM).
        /// </summary>
        public int NumAlm { get; set; }

        /// <summary>
        /// Cantidad de entrada.
        /// </summary>
        public decimal Cantidad { get; set; }

        /// <summary>
        /// Costo unitario usado en esa compra.
        /// </summary>
        public decimal CostoUnitario { get; set; }
    }
}
