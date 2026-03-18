namespace Comssire.Services.Compras
{
    public interface ICompraPdfService
    {
        Task<byte[]> BuildCompraPdfAsync(int compraId);
    }
}
