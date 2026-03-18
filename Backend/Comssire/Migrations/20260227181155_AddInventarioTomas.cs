using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Comssire.Migrations
{
    /// <inheritdoc />
    public partial class AddInventarioTomas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "inv_tomas",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CveAlm = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreadaEn = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreadaPorUserId = table.Column<int>(type: "integer", nullable: true),
                    CerradaEn = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CerradaPorUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_tomas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "inv_tomas_det",
                columns: table => new
                {
                    TomaId = table.Column<long>(type: "bigint", nullable: false),
                    CveArt = table.Column<string>(type: "text", nullable: false),
                    ExistSistema = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    ExistFisico = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CapturadoEn = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inv_tomas_det", x => new { x.TomaId, x.CveArt });
                    table.ForeignKey(
                        name: "FK_inv_tomas_det_inv_tomas_TomaId",
                        column: x => x.TomaId,
                        principalTable: "inv_tomas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_inv_tomas_CveAlm_Status",
                table: "inv_tomas",
                columns: new[] { "CveAlm", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_inv_tomas_det_TomaId",
                table: "inv_tomas_det",
                column: "TomaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inv_tomas_det");

            migrationBuilder.DropTable(
                name: "inv_tomas");
        }
    }
}
