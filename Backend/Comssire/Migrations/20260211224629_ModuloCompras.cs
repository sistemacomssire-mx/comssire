using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Comssire.Migrations
{
    /// <inheritdoc />
    public partial class ModuloCompras : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Compras",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FolioFactura = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CveClpv = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    NumAlmaDefault = table.Column<int>(type: "integer", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Estado = table.Column<int>(type: "integer", nullable: false),
                    MotivoRechazo = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    CreadoPorUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EnviadoAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AprobadoAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RechazadoAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModGeneradoAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EnviadoPorUserId = table.Column<int>(type: "integer", nullable: true),
                    AprobadoPorUserId = table.Column<int>(type: "integer", nullable: true),
                    RechazadoPorUserId = table.Column<int>(type: "integer", nullable: true),
                    ModConsecutivo = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Compras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Compras_Usuarios_AprobadoPorUserId",
                        column: x => x.AprobadoPorUserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Compras_Usuarios_CreadoPorUserId",
                        column: x => x.CreadoPorUserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Compras_Usuarios_EnviadoPorUserId",
                        column: x => x.EnviadoPorUserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Compras_Usuarios_RechazadoPorUserId",
                        column: x => x.RechazadoPorUserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovimientosInventario",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Referencia = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CompraId = table.Column<Guid>(type: "uuid", nullable: false),
                    CveArt = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    NumAlm = table.Column<int>(type: "integer", nullable: false),
                    Cantidad = table.Column<decimal>(type: "numeric", nullable: false),
                    CostoUnitario = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimientosInventario", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CompraPartidas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompraId = table.Column<Guid>(type: "uuid", nullable: false),
                    CveArt = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CantTotal = table.Column<decimal>(type: "numeric", nullable: false),
                    CostoUnitario = table.Column<decimal>(type: "numeric", nullable: false),
                    UniVenta = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    IvaPct = table.Column<decimal>(type: "numeric", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompraPartidas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompraPartidas_Compras_CompraId",
                        column: x => x.CompraId,
                        principalTable: "Compras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompraPartidasAlmacen",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompraPartidaId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumAlm = table.Column<int>(type: "integer", nullable: false),
                    Cant = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompraPartidasAlmacen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompraPartidasAlmacen_CompraPartidas_CompraPartidaId",
                        column: x => x.CompraPartidaId,
                        principalTable: "CompraPartidas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompraPartidas_CompraId",
                table: "CompraPartidas",
                column: "CompraId");

            migrationBuilder.CreateIndex(
                name: "IX_CompraPartidas_CveArt",
                table: "CompraPartidas",
                column: "CveArt");

            migrationBuilder.CreateIndex(
                name: "IX_CompraPartidasAlmacen_CompraPartidaId",
                table: "CompraPartidasAlmacen",
                column: "CompraPartidaId");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_AprobadoPorUserId",
                table: "Compras",
                column: "AprobadoPorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_CreadoPorUserId",
                table: "Compras",
                column: "CreadoPorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_CveClpv_FolioFactura",
                table: "Compras",
                columns: new[] { "CveClpv", "FolioFactura" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Compras_EnviadoPorUserId",
                table: "Compras",
                column: "EnviadoPorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_Estado",
                table: "Compras",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_Fecha",
                table: "Compras",
                column: "Fecha");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_RechazadoPorUserId",
                table: "Compras",
                column: "RechazadoPorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_CompraId",
                table: "MovimientosInventario",
                column: "CompraId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_CveArt_NumAlm",
                table: "MovimientosInventario",
                columns: new[] { "CveArt", "NumAlm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompraPartidasAlmacen");

            migrationBuilder.DropTable(
                name: "MovimientosInventario");

            migrationBuilder.DropTable(
                name: "CompraPartidas");

            migrationBuilder.DropTable(
                name: "Compras");
        }
    }
}
