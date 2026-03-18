namespace Comssire.DTOs.Sync;

public class FullSyncRequestDto
{
    public List<SyncProveedorDto> Proveedores { get; set; } = [];
    public List<SyncProductoDto> Productos { get; set; } = [];
    public List<SyncAlmacenDto> Almacenes { get; set; } = [];
    public List<SyncExistenciaAlmacenDto> Existencias { get; set; } = [];
}