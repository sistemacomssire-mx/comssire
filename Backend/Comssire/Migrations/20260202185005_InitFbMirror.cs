using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Comssire.Migrations
{
    /// <inheritdoc />
    public partial class InitFbMirror : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "fb_almacenes",
                columns: table => new
                {
                    CveAlm = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Descr = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Direccion = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Encargado = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ListaPrec = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CveMent = table.Column<int>(type: "integer", nullable: true),
                    CveMsal = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    Lat = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    Lon = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    Uuid = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    VersionSinc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UbiDest = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fb_almacenes", x => x.CveAlm);
                });

            migrationBuilder.CreateTable(
                name: "fb_existencias_almacen",
                columns: table => new
                {
                    CveArt = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CveAlm = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    Exist = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    StockMin = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    StockMax = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CompXRec = table.Column<int>(type: "integer", nullable: true),
                    Uuid = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    VersionSinc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PendSurt = table.Column<decimal>(type: "numeric(18,6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fb_existencias_almacen", x => new { x.CveArt, x.CveAlm });
                });

            migrationBuilder.CreateTable(
                name: "fb_productos",
                columns: table => new
                {
                    CveArt = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Descr = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LinProd = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ConSerie = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    UniMed = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    UniEmp = table.Column<int>(type: "integer", nullable: true),
                    CtrlAlm = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    TiemSurt = table.Column<int>(type: "integer", nullable: true),
                    StockMin = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    StockMax = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    TipCosteo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    NumMon = table.Column<int>(type: "integer", nullable: true),
                    FchUltCom = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompXRec = table.Column<int>(type: "integer", nullable: true),
                    FchUltVta = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PendSurt = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    Exist = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CostoProm = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    UltCosto = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CveObs = table.Column<int>(type: "integer", nullable: true),
                    TipoEle = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    UniAlt = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    FacConv = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    Apart = table.Column<int>(type: "integer", nullable: true),
                    ConLote = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    ConPedimento = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    Peso = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    Volumen = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CveEsqImpu = table.Column<int>(type: "integer", nullable: true),
                    VtasAnlC = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    VtasAnlM = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CompAnlC = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CompAnlM = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    CuentCont = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BlkCstExt = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Status = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    ManIeps = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    AplManImp = table.Column<int>(type: "integer", nullable: true),
                    CuotaIeps = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    AplManIeps = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    Uuid = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    VersionSinc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VersionSincFechaImg = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CveProdserv = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    CveUnidad = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    LargoMl = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    AltoMl = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    AnchoMl = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    FacUnidCce = table.Column<decimal>(type: "numeric(18,6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fb_productos", x => x.CveArt);
                });

            migrationBuilder.CreateTable(
                name: "fb_proveedores",
                columns: table => new
                {
                    Clave = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    Nombre = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Rfc = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Calle = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    NumInt = table.Column<int>(type: "integer", nullable: true),
                    NumExt = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Cruzamientos = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Cruzamientos2 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Colonia = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Codigo = table.Column<int>(type: "integer", nullable: true),
                    Localidad = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Municipio = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Estado = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    CvePais = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Clasific = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ConCredito = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    DiasCred = table.Column<int>(type: "integer", nullable: true),
                    LimCred = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    UltPagoD = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UltPagoM = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    UltPagoF = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UltCompD = table.Column<int>(type: "integer", nullable: true),
                    UltCompM = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    UltCompF = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Saldo = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    Ventas = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    Descuento = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    TipTercero = table.Column<int>(type: "integer", nullable: true),
                    TipOpera = table.Column<int>(type: "integer", nullable: true),
                    CveObs = table.Column<int>(type: "integer", nullable: true),
                    CuentaContable = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FormaPago = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Banco = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    DescOtros = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Imprir = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    Mail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Enviosilen = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: true),
                    Emailpred = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Lat = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    Lon = table.Column<decimal>(type: "numeric(18,6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fb_proveedores", x => x.Clave);
                });

            migrationBuilder.CreateIndex(
                name: "IX_fb_productos_Descr",
                table: "fb_productos",
                column: "Descr");

            migrationBuilder.CreateIndex(
                name: "IX_fb_proveedores_Nombre",
                table: "fb_proveedores",
                column: "Nombre");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "fb_almacenes");

            migrationBuilder.DropTable(
                name: "fb_existencias_almacen");

            migrationBuilder.DropTable(
                name: "fb_productos");

            migrationBuilder.DropTable(
                name: "fb_proveedores");
        }
    }
}
