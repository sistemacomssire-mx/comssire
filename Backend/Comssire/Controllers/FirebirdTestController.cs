using FirebirdSql.Data.FirebirdClient;
using Microsoft.AspNetCore.Mvc;

namespace Comssire.Controllers;

[ApiController]
[Route("api/test/firebird")]
public class FirebirdTestController : ControllerBase
{
    private readonly IConfiguration _cfg;

    public FirebirdTestController(IConfiguration cfg)
    {
        _cfg = cfg;
    }

    [HttpGet("ping")]
    public async Task<IActionResult> Ping()
    {
        var cs = _cfg.GetConnectionString("Firebird");

        await using var con = new FbConnection(cs);
        await con.OpenAsync();

        // Consulta mínima “universal”
        await using var cmd = new FbCommand("SELECT 1 FROM RDB$DATABASE", con);
        var result = await cmd.ExecuteScalarAsync();

        return Ok(new { ok = true, result });
    }
}
