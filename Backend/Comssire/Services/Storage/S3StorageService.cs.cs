using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace Comssire.Services.Storage
{
    public sealed class S3StorageService : IStorageService
    {
        private readonly IAmazonS3 _s3;
        private readonly StorageOptions _options;

        public S3StorageService(IOptions<StorageOptions> options)
        {
            _options = options.Value;

            var config = new AmazonS3Config
            {
                ServiceURL = _options.Endpoint,
                ForcePathStyle = true,
                AuthenticationRegion = string.IsNullOrWhiteSpace(_options.Region) ? "auto" : _options.Region
            };

            _s3 = new AmazonS3Client(_options.AccessKey, _options.SecretKey, config);
        }

        public async Task<string> UploadAsync(IFormFile file, string objectKey, CancellationToken ct = default)
        {
            await using var stream = file.OpenReadStream();

            var request = new PutObjectRequest
            {
                BucketName = _options.Bucket,
                Key = objectKey,
                InputStream = stream,
                ContentType = file.ContentType
            };

            await _s3.PutObjectAsync(request, ct);
            return objectKey;
        }

        public async Task DeleteAsync(string objectKey, CancellationToken ct = default)
        {
            await _s3.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _options.Bucket,
                Key = objectKey
            }, ct);
        }

        public string GetPresignedReadUrl(string objectKey, TimeSpan duration)
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _options.Bucket,
                Key = objectKey,
                Expires = DateTime.UtcNow.Add(duration)
            };

            return _s3.GetPreSignedURL(request);
        }
    }
}