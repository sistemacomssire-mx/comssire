using System.Text.Json;
using Comssire.SyncAgent.Models;

namespace Comssire.SyncAgent.Services;

public class SyncStateStore
{
    private readonly string _filePath;

    public SyncStateStore()
    {
        var baseDir = AppContext.BaseDirectory;
        _filePath = Path.Combine(baseDir, "sync-state.json");
    }

    public async Task<SyncState> LoadAsync(CancellationToken ct = default)
    {
        if (!File.Exists(_filePath))
            return new SyncState();

        await using var fs = File.OpenRead(_filePath);
        var data = await JsonSerializer.DeserializeAsync<SyncState>(fs, cancellationToken: ct);
        return data ?? new SyncState();
    }

    public async Task SaveAsync(SyncState state, CancellationToken ct = default)
    {
        await using var fs = File.Create(_filePath);
        await JsonSerializer.SerializeAsync(fs, state, new JsonSerializerOptions
        {
            WriteIndented = true
        }, ct);
    }
}