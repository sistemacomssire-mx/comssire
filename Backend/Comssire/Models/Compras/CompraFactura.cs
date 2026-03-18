using System.ComponentModel.DataAnnotations;

namespace Comssire.Models.Compras
{
    public class CompraFactura
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CompraId { get; set; }

        [Required, MaxLength(500)]
        public string ObjectKey { get; set; } = string.Empty;

        [Required, MaxLength(255)]
        public string FileNameOriginal { get; set; } = string.Empty;

        [Required, MaxLength(120)]
        public string ContentType { get; set; } = string.Empty;

        public long SizeBytes { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public int UploadedByUserId { get; set; }
    }
}