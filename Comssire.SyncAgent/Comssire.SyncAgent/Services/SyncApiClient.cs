using System.Net.Http.Json;
using Comssire.SyncAgent.Models;
using Comssire.SyncAgent.Options;
using Microsoft.Extensions.Options;

namespace Comssire.SyncAgent.Services;

public class SyncApiClient
{
    private readonly HttpClient _http;
    private readonly SyncApiOptions _options;

    public SyncApiClient(HttpClient http, IOptions<SyncApiOptions> options)
    {
        _http = http;
        _options = options.Value;

        _http.BaseAddress = new Uri(_options.BaseUrl.TrimEnd('/'));
        _http.DefaultRequestHeaders.Remove("X-Sync-Api-Key");
        _http.DefaultRequestHeaders.Add("X-Sync-Api-Key", _options.ApiKey);
    }

    public async Task PushDeltaAsync(
        List<SyncProveedorDto> proveedores,
        List<SyncProductoDto> productos,
        List<SyncAlmacenDto> almacenes,
        List<SyncExistenciaAlmacenDto> existencias,
        CancellationToken ct)
    {
        var payload = new IncrementalSyncRequestDto
        {
            Proveedores = proveedores,
            Productos = productos,
            Almacenes = almacenes,
            Existencias = existencias
        };

        using var resp = await _http.PostAsJsonAsync("/api/sync/upsert-delta", payload, ct);
        var content = await resp.Content.ReadAsStringAsync(ct);

        if (!resp.IsSuccessStatusCode)
            throw new HttpRequestException($"Error sync API ({(int)resp.StatusCode}): {content}");
    }

    private sealed class IncrementalSyncRequestDto
    {
        public List<SyncProveedorDto> Proveedores { get; set; } = [];
        public List<SyncProductoDto> Productos { get; set; } = [];
        public List<SyncAlmacenDto> Almacenes { get; set; } = [];
        public List<SyncExistenciaAlmacenDto> Existencias { get; set; } = [];
    }
}