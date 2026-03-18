using FirebirdSql.Data.FirebirdClient;
using Microsoft.AspNetCore.Mvc;

namespace Comssire.Controllers;

[ApiController]
[Route("api/test/firebird")]
public class FirebirdSchemaController : ControllerBase
{
    private readonly IConfiguration _cfg;
    public FirebirdSchemaController(IConfiguration cfg) => _cfg = cfg;

    [HttpGet("tables")]
    public async Task<IActionResult> ListTables([FromQuery] string? contains = null)
    {
        var cs = _cfg.GetConnectionString("Firebird");
        await using var con = new FbConnection(cs);
        await con.OpenAsync();

        // Tablas de usuario (no sistema)
        var sql = @"
            SELECT TRIM(rdb$relation_name) AS name
            FROM rdb$relations
            WHERE rdb$system_flag = 0
            ORDER BY rdb$relation_name
        ";

        var list = new List<string>();
        await using var cmd = new FbCommand(sql, con);
        await using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            var name = r["name"]?.ToString()?.Trim();
            if (string.IsNullOrWhiteSpace(name)) continue;

            if (string.IsNullOrWhiteSpace(contains) ||
                name.Contains(contains, StringComparison.OrdinalIgnoreCase))
            {
                list.Add(name);
            }
        }

        return Ok(new { total = list.Count, tables = list });
    }
}
