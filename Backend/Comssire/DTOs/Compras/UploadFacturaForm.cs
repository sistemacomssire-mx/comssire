using Microsoft.AspNetCore.Http;

namespace Comssire.DTOs.Compras
{
    public class UploadFacturaForm
    {
        public IFormFile File { get; set; } = default!;
    }
}