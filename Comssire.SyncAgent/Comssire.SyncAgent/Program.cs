using Comssire.SyncAgent;
using Comssire.SyncAgent.Options;
using Comssire.SyncAgent.Services;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.Configure<FirebirdOptions>(
    builder.Configuration.GetSection("Firebird"));

builder.Services.Configure<SyncApiOptions>(
    builder.Configuration.GetSection("SyncApi"));

builder.Services.AddHttpClient<SyncApiClient>();

builder.Services.AddSingleton<FirebirdReaderService>();
builder.Services.AddSingleton<SyncStateStore>();

builder.Services.AddHostedService<Worker>();

builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "Comssire Sync Agent";
});

var host = builder.Build();
host.Run();