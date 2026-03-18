namespace Comssire.Services.Storage
{
    public interface IStorageService
    {
        Task<string> UploadAsync(IFormFile file, string objectKey, CancellationToken ct = default);
        Task DeleteAsync(string objectKey, CancellationToken ct = default);
        string GetPresignedReadUrl(string objectKey, TimeSpan duration);
    }
}