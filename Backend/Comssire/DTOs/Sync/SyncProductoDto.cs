namespace Comssire.DTOs.Sync;

public class SyncProductoDto
{
    public string CveArt { get; set; } = default!;
    public string? Descr { get; set; }
    public string? LinProd { get; set; }
    public string? ConSerie { get; set; }
    public string? UniMed { get; set; }
    public int? UniEmp { get; set; }
    public string? CtrlAlm { get; set; }
    public int? TiemSurt { get; set; }
    public decimal? StockMin { get; set; }
    public decimal? StockMax { get; set; }
    public string? TipCosteo { get; set; }
    public int? NumMon { get; set; }
    public DateTime? FchUltCom { get; set; }
    public int? CompXRec { get; set; }
    public DateTime? FchUltVta { get; set; }
    public decimal? PendSurt { get; set; }
    public decimal? Exist { get; set; }
    public decimal? CostoProm { get; set; }
    public decimal? UltCosto { get; set; }
    public int? CveObs { get; set; }
    public string? TipoEle { get; set; }
    public string? UniAlt { get; set; }
    public decimal? FacConv { get; set; }
    public int? Apart { get; set; }
    public string? ConLote { get; set; }
    public string? ConPedimento { get; set; }
    public decimal? Peso { get; set; }
    public decimal? Volumen { get; set; }
    public int? CveEsqImpu { get; set; }
    public decimal? VtasAnlC { get; set; }
    public decimal? VtasAnlM { get; set; }
    public decimal? CompAnlC { get; set; }
    public decimal? CompAnlM { get; set; }
    public string? CuentCont { get; set; }
    public string? BlkCstExt { get; set; }
    public string? Status { get; set; }
    public string? ManIeps { get; set; }
    public int? AplManImp { get; set; }
    public decimal? CuotaIeps { get; set; }
    public string? AplManIeps { get; set; }
    public string? Uuid { get; set; }
    public DateTime? VersionSinc { get; set; }
    public DateTime? VersionSincFechaImg { get; set; }
    public string? CveProdserv { get; set; }
    public string? CveUnidad { get; set; }
    public decimal? LargoMl { get; set; }
    public decimal? AltoMl { get; set; }
    public decimal? AnchoMl { get; set; }
    public decimal? FacUnidCce { get; set; }
}