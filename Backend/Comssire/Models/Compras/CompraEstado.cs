namespace Comssire.Models.Compras
{
    /// <summary>
    /// Estados del flujo de compras:
    /// - Borrador: editable por el creador (worker/admin).
    /// - Enviada: enviada a aprobación, se bloquea para edición (salvo que admin permita corrección).
    /// - Rechazada: el admin la regresó con motivo; vuelve editable para corregir y reenviar.
    /// - Aprobada: el admin aprobó; aquí se impacta inventario interno y se permite generar MOD.
    /// - Exportada: opcional; marca que el MOD ya se descargó al menos una vez.
    /// </summary>
    public enum CompraEstado
    {
        Borrador = 1,
        Enviada = 2,
        Rechazada = 3,
        Aprobada = 4,
        Exportada = 5
    }
}
