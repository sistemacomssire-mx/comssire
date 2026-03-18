namespace Comssire.DTOs.Compras
{
    public class CompraFacturaDto
    {
        public Guid Id { get; set; }
        public Guid CompraId { get; set; }
        public string FileNameOriginal { get; set; } = "";
        public string ContentType { get; set; } = "";
        public long SizeBytes { get; set; }
        public DateTime UploadedAt { get; set; }
        public string ViewUrl { get; set; } = "";
    }
}