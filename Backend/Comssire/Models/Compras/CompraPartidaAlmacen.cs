using System.ComponentModel.DataAnnotations;

namespace Comssire.Models.Compras
{
    public class CompraPartidaAlmacen
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CompraPartidaId { get; set; }

        public CompraPartida? Partida { get; set; }

        public int NumAlm { get; set; }

        public decimal Cant { get; set; }
    }
}
