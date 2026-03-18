using Comssire.SyncAgent.Models;
using Comssire.SyncAgent.Options;
using FirebirdSql.Data.FirebirdClient;
using Microsoft.Extensions.Options;

namespace Comssire.SyncAgent.Services;

public class FirebirdReaderService
{
    private readonly string _connectionString;

    public FirebirdReaderService(IOptions<FirebirdOptions> options)
    {
        _connectionString = options.Value.ConnectionString;
    }

    private static string? S(FbDataReader r, string col) =>
        r[col] == DBNull.Value ? null : r[col].ToString();

    private static int? I(FbDataReader r, string col) =>
        r[col] == DBNull.Value ? null : Convert.ToInt32(r[col]);

    private static decimal? D(FbDataReader r, string col) =>
        r[col] == DBNull.Value ? null : Convert.ToDecimal(r[col]);

    private static DateTime? DT(FbDataReader r, string col) =>
        r[col] == DBNull.Value ? null : Convert.ToDateTime(r[col]);

    public async Task<List<SyncProveedorDto>> GetProveedoresAsync(CancellationToken ct)
    {
        var items = new List<SyncProveedorDto>();

        await using var con = new FbConnection(_connectionString);
        await con.OpenAsync(ct);

        await using var cmd = new FbCommand(@"
            SELECT
              CLAVE, STATUS, NOMBRE, RFC, CALLE, NUMINT, NUMEXT, CRUZAMIENTOS, CRUZAMIENTOS2, COLONIA,
              CODIGO, LOCALIDAD, MUNICIPIO, ESTADO, CVE_PAIS, TELEFONO, CLASIFIC,
              CON_CREDITO, DIASCRED, LIMCRED,
              ULT_PAGOD, ULT_PAGOM, ULT_PAGOF,
              ULT_COMPD, ULT_COMPM, ULT_COMPF,
              SALDO, VENTAS, DESCUENTO,
              TIP_TERCERO, TIP_OPERA, CVE_OBS,
              CUENTA_CONTABLE, FORMA_PAGO, BANCO, DESC_OTROS,
              IMPRIR, MAIL, ENVIOSILEN, EMAILPRED, LAT, LON
            FROM PROV02
        ", con);

        await using var r = await cmd.ExecuteReaderAsync(ct);
        while (await r.ReadAsync(ct))
        {
            items.Add(new SyncProveedorDto
            {
                Clave = S(r, "CLAVE")!,
                Status = S(r, "STATUS"),
                Nombre = S(r, "NOMBRE"),
                Rfc = S(r, "RFC"),
                Calle = S(r, "CALLE"),
                NumInt = I(r, "NUMINT"),
                NumExt = S(r, "NUMEXT"),
                Cruzamientos = S(r, "CRUZAMIENTOS"),
                Cruzamientos2 = S(r, "CRUZAMIENTOS2"),
                Colonia = S(r, "COLONIA"),
                Codigo = I(r, "CODIGO"),
                Localidad = S(r, "LOCALIDAD"),
                Municipio = S(r, "MUNICIPIO"),
                Estado = S(r, "ESTADO"),
                CvePais = S(r, "CVE_PAIS"),
                Telefono = S(r, "TELEFONO"),
                Clasific = S(r, "CLASIFIC"),
                ConCredito = S(r, "CON_CREDITO"),
                DiasCred = I(r, "DIASCRED"),
                LimCred = D(r, "LIMCRED"),
                UltPagoD = S(r, "ULT_PAGOD"),
                UltPagoM = D(r, "ULT_PAGOM"),
                UltPagoF = DT(r, "ULT_PAGOF"),
                UltCompD = I(r, "ULT_COMPD"),
                UltCompM = D(r, "ULT_COMPM"),
                UltCompF = DT(r, "ULT_COMPF"),
                Saldo = D(r, "SALDO"),
                Ventas = D(r, "VENTAS"),
                Descuento = D(r, "DESCUENTO"),
                TipTercero = I(r, "TIP_TERCERO"),
                TipOpera = I(r, "TIP_OPERA"),
                CveObs = I(r, "CVE_OBS"),
                CuentaContable = S(r, "CUENTA_CONTABLE"),
                FormaPago = S(r, "FORMA_PAGO"),
                Banco = S(r, "BANCO"),
                DescOtros = S(r, "DESC_OTROS"),
                Imprir = S(r, "IMPRIR"),
                Mail = S(r, "MAIL"),
                Enviosilen = S(r, "ENVIOSILEN"),
                Emailpred = S(r, "EMAILPRED"),
                Lat = D(r, "LAT"),
                Lon = D(r, "LON")
            });
        }

        return items;
    }

    public async Task<List<SyncProductoDto>> GetProductosAsync(DateTime? since, CancellationToken ct)
    {
        var items = new List<SyncProductoDto>();

        await using var con = new FbConnection(_connectionString);
        await con.OpenAsync(ct);

        var sql = @"
            SELECT
              CVE_ART, DESCR, LIN_PROD, CON_SERIE, UNI_MED, UNI_EMP, CTRL_ALM, TIEM_SURT,
              STOCK_MIN, STOCK_MAX, TIP_COSTEO, NUM_MON, FCH_ULTCOM, COMP_X_REC, FCH_ULTVTA,
              PEND_SURT, EXIST, COSTO_PROM, ULT_COSTO, CVE_OBS, TIPO_ELE, UNI_ALT, FAC_CONV,
              APART, CON_LOTE, CON_PEDIMENTO, PESO, VOLUMEN, CVE_ESQIMPU,
              VTAS_ANL_C, VTAS_ANL_M, COMP_ANL_C, COMP_ANL_M,
              CUENT_CONT, BLK_CST_EXT, STATUS,
              MAN_IEPS, APL_MAN_IMP, CUOTA_IEPS, APL_MAN_IEPS,
              UUID, VERSION_SINC, VERSION_SINC_FECHA_IMG,
              CVE_PRODSERV, CVE_UNIDAD,
              LARGO_ML, ALTO_ML, ANCHO_ML, FAC_UNID_CCE
            FROM INVE02
        ";

        if (since.HasValue)
            sql += " WHERE VERSION_SINC > @since";

        await using var cmd = new FbCommand(sql, con);

        if (since.HasValue)
            cmd.Parameters.Add(new FbParameter("@since", FbDbType.TimeStamp) { Value = since.Value });

        await using var r = await cmd.ExecuteReaderAsync(ct);
        while (await r.ReadAsync(ct))
        {
            items.Add(new SyncProductoDto
            {
                CveArt = S(r, "CVE_ART")!,
                Descr = S(r, "DESCR"),
                LinProd = S(r, "LIN_PROD"),
                ConSerie = S(r, "CON_SERIE"),
                UniMed = S(r, "UNI_MED"),
                UniEmp = I(r, "UNI_EMP"),
                CtrlAlm = S(r, "CTRL_ALM"),
                TiemSurt = I(r, "TIEM_SURT"),
                StockMin = D(r, "STOCK_MIN"),
                StockMax = D(r, "STOCK_MAX"),
                TipCosteo = S(r, "TIP_COSTEO"),
                NumMon = I(r, "NUM_MON"),
                FchUltCom = DT(r, "FCH_ULTCOM"),
                CompXRec = I(r, "COMP_X_REC"),
                FchUltVta = DT(r, "FCH_ULTVTA"),
                PendSurt = D(r, "PEND_SURT"),
                Exist = D(r, "EXIST"),
                CostoProm = D(r, "COSTO_PROM"),
                UltCosto = D(r, "ULT_COSTO"),
                CveObs = I(r, "CVE_OBS"),
                TipoEle = S(r, "TIPO_ELE"),
                UniAlt = S(r, "UNI_ALT"),
                FacConv = D(r, "FAC_CONV"),
                Apart = I(r, "APART"),
                ConLote = S(r, "CON_LOTE"),
                ConPedimento = S(r, "CON_PEDIMENTO"),
                Peso = D(r, "PESO"),
                Volumen = D(r, "VOLUMEN"),
                CveEsqImpu = I(r, "CVE_ESQIMPU"),
                VtasAnlC = D(r, "VTAS_ANL_C"),
                VtasAnlM = D(r, "VTAS_ANL_M"),
                CompAnlC = D(r, "COMP_ANL_C"),
                CompAnlM = D(r, "COMP_ANL_M"),
                CuentCont = S(r, "CUENT_CONT"),
                BlkCstExt = S(r, "BLK_CST_EXT"),
                Status = S(r, "STATUS"),
                ManIeps = S(r, "MAN_IEPS"),
                AplManImp = I(r, "APL_MAN_IMP"),
                CuotaIeps = D(r, "CUOTA_IEPS"),
                AplManIeps = S(r, "APL_MAN_IEPS"),
                Uuid = S(r, "UUID"),
                VersionSinc = DT(r, "VERSION_SINC"),
                VersionSincFechaImg = DT(r, "VERSION_SINC_FECHA_IMG"),
                CveProdserv = S(r, "CVE_PRODSERV"),
                CveUnidad = S(r, "CVE_UNIDAD"),
                LargoMl = D(r, "LARGO_ML"),
                AltoMl = D(r, "ALTO_ML"),
                AnchoMl = D(r, "ANCHO_ML"),
                FacUnidCce = D(r, "FAC_UNID_CCE")
            });
        }

        return items;
    }

    public async Task<List<SyncAlmacenDto>> GetAlmacenesAsync(DateTime? since, CancellationToken ct)
    {
        var items = new List<SyncAlmacenDto>();

        await using var con = new FbConnection(_connectionString);
        await con.OpenAsync(ct);

        var sql = @"
            SELECT
              CVE_ALM, DESCR, DIRECCION, ENCARGADO, TELEFONO, LISTA_PREC,
              CVE_MENT, CVE_MSAL, STATUS, LAT, LON, UUID, VERSION_SINC, UBI_DEST
            FROM ALMACENES02
        ";

        if (since.HasValue)
            sql += " WHERE VERSION_SINC > @since";

        await using var cmd = new FbCommand(sql, con);

        if (since.HasValue)
            cmd.Parameters.Add(new FbParameter("@since", FbDbType.TimeStamp) { Value = since.Value });

        await using var r = await cmd.ExecuteReaderAsync(ct);
        while (await r.ReadAsync(ct))
        {
            items.Add(new SyncAlmacenDto
            {
                CveAlm = Convert.ToInt32(r["CVE_ALM"]),
                Descr = S(r, "DESCR"),
                Direccion = S(r, "DIRECCION"),
                Encargado = S(r, "ENCARGADO"),
                Telefono = S(r, "TELEFONO"),
                ListaPrec = D(r, "LISTA_PREC"),
                CveMent = I(r, "CVE_MENT"),
                CveMsal = I(r, "CVE_MSAL"),
                Status = S(r, "STATUS"),
                Lat = D(r, "LAT"),
                Lon = D(r, "LON"),
                Uuid = S(r, "UUID"),
                VersionSinc = DT(r, "VERSION_SINC"),
                UbiDest = S(r, "UBI_DEST")
            });
        }

        return items;
    }

    // MULT02 COMPLETA: sin filtro VERSION_SINC
    public async Task<List<SyncExistenciaAlmacenDto>> GetExistenciasAsync(CancellationToken ct)
    {
        var items = new List<SyncExistenciaAlmacenDto>();

        await using var con = new FbConnection(_connectionString);
        await con.OpenAsync(ct);

        await using var cmd = new FbCommand(@"
            SELECT
              CVE_ART, CVE_ALM, STATUS, EXIST, STOCK_MIN, STOCK_MAX, COMP_X_REC, UUID, VERSION_SINC, PEND_SURT
            FROM MULT02
        ", con);

        await using var r = await cmd.ExecuteReaderAsync(ct);
        while (await r.ReadAsync(ct))
        {
            items.Add(new SyncExistenciaAlmacenDto
            {
                CveArt = S(r, "CVE_ART")!,
                CveAlm = Convert.ToInt32(r["CVE_ALM"]),
                Status = S(r, "STATUS"),
                Exist = D(r, "EXIST"),
                StockMin = D(r, "STOCK_MIN"),
                StockMax = D(r, "STOCK_MAX"),
                CompXRec = I(r, "COMP_X_REC"),
                Uuid = S(r, "UUID"),
                VersionSinc = DT(r, "VERSION_SINC"),
                PendSurt = D(r, "PEND_SURT")
            });
        }

        return items;
    }
}