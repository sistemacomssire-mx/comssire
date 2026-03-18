using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Comssire.Migrations
{
    /// <inheritdoc />
    public partial class AddCompraFactura : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CompraFacturas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompraId = table.Column<Guid>(type: "uuid", nullable: false),
                    ObjectKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FileNameOriginal = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UploadedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CompraId1 = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompraFacturas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompraFacturas_Compras_CompraId",
                        column: x => x.CompraId,
                        principalTable: "Compras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompraFacturas_Compras_CompraId1",
                        column: x => x.CompraId1,
                        principalTable: "Compras",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompraFacturas_CompraId",
                table: "CompraFacturas",
                column: "CompraId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompraFacturas_CompraId1",
                table: "CompraFacturas",
                column: "CompraId1",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompraFacturas_UploadedByUserId",
                table: "CompraFacturas",
                column: "UploadedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompraFacturas");
        }
    }
}
