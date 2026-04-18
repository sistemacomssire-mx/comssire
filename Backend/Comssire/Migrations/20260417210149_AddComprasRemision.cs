using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Comssire.Migrations
{
    /// <inheritdoc />
    public partial class AddComprasRemision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ComprasRemision",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FolioRemision = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CveClpv = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    NumAlmaDefault = table.Column<int>(type: "integer", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    CreadoPorUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModGeneradoAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModConsecutivo = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComprasRemision", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComprasRemision_Usuarios_CreadoPorUserId",
                        column: x => x.CreadoPorUserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CompraRemisionPartidas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompraRemisionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CveArt = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CantTotal = table.Column<decimal>(type: "numeric", nullable: false),
                    CostoUnitario = table.Column<decimal>(type: "numeric", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "numeric", nullable: false),
                    UniVenta = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    IvaPct = table.Column<decimal>(type: "numeric", nullable: false),
                    Observaciones = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompraRemisionPartidas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompraRemisionPartidas_ComprasRemision_CompraRemisionId",
                        column: x => x.CompraRemisionId,
                        principalTable: "ComprasRemision",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompraRemisionPartidasAlmacen",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompraRemisionPartidaId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumAlm = table.Column<int>(type: "integer", nullable: false),
                    Cant = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompraRemisionPartidasAlmacen", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompraRemisionPartidasAlmacen_CompraRemisionPartidas_Compra~",
                        column: x => x.CompraRemisionPartidaId,
                        principalTable: "CompraRemisionPartidas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompraRemisionPartidas_CompraRemisionId",
                table: "CompraRemisionPartidas",
                column: "CompraRemisionId");

            migrationBuilder.CreateIndex(
                name: "IX_CompraRemisionPartidas_CveArt",
                table: "CompraRemisionPartidas",
                column: "CveArt");

            migrationBuilder.CreateIndex(
                name: "IX_CompraRemisionPartidasAlmacen_CompraRemisionPartidaId",
                table: "CompraRemisionPartidasAlmacen",
                column: "CompraRemisionPartidaId");

            migrationBuilder.CreateIndex(
                name: "IX_CompraRemisionPartidasAlmacen_NumAlm",
                table: "CompraRemisionPartidasAlmacen",
                column: "NumAlm");

            migrationBuilder.CreateIndex(
                name: "IX_ComprasRemision_CreadoPorUserId",
                table: "ComprasRemision",
                column: "CreadoPorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ComprasRemision_CveClpv",
                table: "ComprasRemision",
                column: "CveClpv");

            migrationBuilder.CreateIndex(
                name: "IX_ComprasRemision_Fecha",
                table: "ComprasRemision",
                column: "Fecha");

            migrationBuilder.CreateIndex(
                name: "IX_ComprasRemision_FolioRemision",
                table: "ComprasRemision",
                column: "FolioRemision");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompraRemisionPartidasAlmacen");

            migrationBuilder.DropTable(
                name: "CompraRemisionPartidas");

            migrationBuilder.DropTable(
                name: "ComprasRemision");
        }
    }
}
