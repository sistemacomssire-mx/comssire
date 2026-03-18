using Comssire.SyncAgent.Models;
using Comssire.SyncAgent.Services;

namespace Comssire.SyncAgent;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly FirebirdReaderService _reader;
    private readonly SyncApiClient _api;
    private readonly SyncStateStore _stateStore;
    private readonly IConfiguration _configuration;

    public Worker(
        ILogger<Worker> logger,
        FirebirdReaderService reader,
        SyncApiClient api,
        SyncStateStore stateStore,
        IConfiguration configuration)
    {
        _logger = logger;
        _reader = reader;
        _api = api;
        _stateStore = stateStore;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var intervalSeconds = _configuration.GetValue<int>("Sync:IntervalSeconds", 30);
        var proveedoresFullSyncMinutes = _configuration.GetValue<int>("Sync:ProveedoresFullSyncMinutes", 30);

        _logger.LogInformation("Comssire Sync Agent iniciado. Intervalo: {IntervalSeconds}s", intervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var state = await _stateStore.LoadAsync(stoppingToken);

                var nowUtc = DateTime.UtcNow;
                var mustSyncProveedores =
                    !state.ProveedoresLastFullSyncUtc.HasValue ||
                    nowUtc >= state.ProveedoresLastFullSyncUtc.Value.AddMinutes(proveedoresFullSyncMinutes);

                _logger.LogInformation(
                    "Leyendo Firebird... ProductosDesde={Prod}, AlmacenesDesde={Alm}, SyncProv={SyncProv}, Existencias=FULL",
                    state.ProductosLastVersionSinc,
                    state.AlmacenesLastVersionSinc,
                    mustSyncProveedores);

                var proveedores = mustSyncProveedores
                    ? await _reader.GetProveedoresAsync(stoppingToken)
                    : new List<SyncProveedorDto>();

                var productos = await _reader.GetProductosAsync(state.ProductosLastVersionSinc, stoppingToken);
                var almacenes = await _reader.GetAlmacenesAsync(state.AlmacenesLastVersionSinc, stoppingToken);

                // FULL de MULT02 siempre
                var existencias = await _reader.GetExistenciasAsync(stoppingToken);

                _logger.LogInformation(
                    "Leídos desde Firebird -> Prov: {Prov}, Prod: {Prod}, Alm: {Alm}, Exist(FULL): {Exist}",
                    proveedores.Count, productos.Count, almacenes.Count, existencias.Count);

                if (proveedores.Count == 0 &&
                    productos.Count == 0 &&
                    almacenes.Count == 0 &&
                    existencias.Count == 0)
                {
                    _logger.LogInformation("No hay cambios para sincronizar.");
                }
                else
                {
                    _logger.LogInformation("Enviando delta/full híbrido a la API...");

                    await _api.PushDeltaAsync(
                        proveedores,
                        productos,
                        almacenes,
                        existencias,
                        stoppingToken);

                    if (mustSyncProveedores)
                        state.ProveedoresLastFullSyncUtc = nowUtc;

                    var maxProd = productos
                        .Where(x => x.VersionSinc.HasValue)
                        .Select(x => x.VersionSinc!.Value)
                        .DefaultIfEmpty(state.ProductosLastVersionSinc ?? default)
                        .Max();

                    var maxAlm = almacenes
                        .Where(x => x.VersionSinc.HasValue)
                        .Select(x => x.VersionSinc!.Value)
                        .DefaultIfEmpty(state.AlmacenesLastVersionSinc ?? default)
                        .Max();

                    if (productos.Count > 0 && maxProd != default)
                        state.ProductosLastVersionSinc = maxProd;

                    if (almacenes.Count > 0 && maxAlm != default)
                        state.AlmacenesLastVersionSinc = maxAlm;

                    await _stateStore.SaveAsync(state, stoppingToken);

                    _logger.LogInformation("Sincronización híbrida completada correctamente.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error durante la sincronización");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }
    }
}