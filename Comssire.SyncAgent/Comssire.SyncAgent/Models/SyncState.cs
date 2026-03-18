namespace Comssire.SyncAgent.Models;

public class SyncState
{
    public DateTime? ProductosLastVersionSinc { get; set; }
    public DateTime? AlmacenesLastVersionSinc { get; set; }

    public DateTime? ProveedoresLastFullSyncUtc { get; set; }
}