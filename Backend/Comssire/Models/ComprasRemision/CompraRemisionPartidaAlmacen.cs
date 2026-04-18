using System.ComponentModel.DataAnnotations;

namespace Comssire.Models.ComprasRemision
{
    public class CompraRemisionPartidaAlmacen
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CompraRemisionPartidaId { get; set; }

        public CompraRemisionPartida? Partida { get; set; }

        public int NumAlm { get; set; }

        public decimal Cant { get; set; }
    }
}