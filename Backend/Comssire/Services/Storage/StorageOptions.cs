namespace Comssire.Services.Storage
{
    public class StorageOptions
    {
        public string Endpoint { get; set; } = "";
        public string Region { get; set; } = "";
        public string Bucket { get; set; } = "";
        public string AccessKey { get; set; } = "";
        public string SecretKey { get; set; } = "";
    }
}