// Controllers/ReportsController.cs
using InvoiceFlow.Infrastructure.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace InvoiceFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly GstInvoiceTrackerDbContext _db;

    public ReportsController(GstInvoiceTrackerDbContext db) => _db = db;

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<Guid?> GetUserBusinessIdAsync()
    {
        var userId = GetUserId();
        return await _db.AuthUsers
            .Where(u => u.Id == userId)
            .Select(u => u.BusinessProfileId)
            .FirstOrDefaultAsync();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GST Reports
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// GSTR-1 style report: outward supplies summary for a given month/year.
    /// Returns a breakdown of taxable, CGST, SGST, and IGST amounts.
    /// </summary>
    [HttpGet("gstr1")]
    [ProducesResponseType(typeof(GstR1ReportDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Gstr1(
        [FromQuery, Required] int year,
        [FromQuery, Required] int month)
    {
        if (month < 1 || month > 12)
            return BadRequest("Month must be between 1 and 12.");

        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var from = new DateOnly(year, month, 1);
        var to   = from.AddMonths(1).AddDays(-1);

        var invoices = await _db.Invoices
            .Include(i => i.Customer)
            .Where(i => i.BusinessId == businessId
                     && i.InvoiceDate >= from
                     && i.InvoiceDate <= to
                     && i.Status != "cancelled"
                     && i.InvoiceType == "tax_invoice")
            .OrderBy(i => i.InvoiceDate)
            .ToListAsync();

        var interState  = invoices.Where(i => (bool)i.IsInterState).ToList();
        var intraState  = invoices.Where(i => (bool)!i.IsInterState).ToList();

        var report = new GstR1ReportDto
        {
            Year  = year,
            Month = month,
            InterStateSummary = new GstTaxSummary
            {
                InvoiceCount  = interState.Count,
                Taxable       = interState.Sum(i => i.Subtotal),
                IgstAmount    = interState.Sum(i => i.IgstAmount),
                TotalTax      = interState.Sum(i => i.TotalTax),
                TotalAmount   = interState.Sum(i => i.TotalAmount)
            },
            IntraStateSummary = new GstTaxSummary
            {
                InvoiceCount  = intraState.Count,
                Taxable       = intraState.Sum(i => i.Subtotal),
                CgstAmount    = intraState.Sum(i => i.CgstAmount),
                SgstAmount    = intraState.Sum(i => i.SgstAmount),
                TotalTax      = intraState.Sum(i => i.TotalTax),
                TotalAmount   = intraState.Sum(i => i.TotalAmount)
            },
            Invoices = invoices.Select(i => new GstR1InvoiceDto
            {
                InvoiceId     = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                InvoiceDate   = i.InvoiceDate,
                CustomerName  = i.Customer?.Name,
                CustomerGstin = i.Customer?.Gstin,
                IsInterState  = i.IsInterState,
                PlaceOfSupply = i.PlaceOfSupply,
                Taxable       = i.Subtotal,
                CgstAmount    = i.CgstAmount,
                SgstAmount    = i.SgstAmount,
                IgstAmount    = i.IgstAmount,
                TotalTax      = i.TotalTax,
                TotalAmount   = i.TotalAmount
            }).ToList()
        };

        return Ok(report);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Sales Report
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns a sales report for a date range, grouped by customer.
    /// Excludes cancelled invoices.
    /// </summary>
    [HttpGet("sales")]
    [ProducesResponseType(typeof(SalesReportDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Sales(
        [FromQuery, Required] DateOnly from,
        [FromQuery, Required] DateOnly to)
    {
        if (to < from)
            return BadRequest("'to' must be on or after 'from'.");

        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var invoices = await _db.Invoices
            .Include(i => i.Customer)
            .Where(i => i.BusinessId == businessId
                     && i.InvoiceDate >= from
                     && i.InvoiceDate <= to
                     && i.Status != "cancelled")
            .ToListAsync();

        var byCustomer = invoices
            .GroupBy(i => new { i.CustomerId, Name = i.Customer?.Name ?? "Unknown" })
            .Select(g => new SalesByCustomerDto
            {
                CustomerId    = g.Key.CustomerId,
                CustomerName  = g.Key.Name,
                InvoiceCount  = g.Count(),
                TotalInvoiced = g.Sum(i => i.TotalAmount),
                TotalPaid     = g.Sum(i => i.AmountPaid),
                TotalOutstanding = g.Sum(i => i.TotalAmount - i.AmountPaid)
            })
            .OrderByDescending(x => x.TotalInvoiced)
            .ToList();

        var report = new SalesReportDto
        {
            From           = from,
            To             = to,
            TotalInvoiced  = invoices.Sum(i => i.TotalAmount),
            TotalPaid      = invoices.Sum(i => i.AmountPaid),
            TotalOutstanding = invoices.Sum(i => i.TotalAmount - i.AmountPaid),
            TotalTax       = invoices.Sum(i => i.TotalTax),
            InvoiceCount   = invoices.Count,
            ByCustomer     = byCustomer
        };

        return Ok(report);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Outstanding / Aging Report
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns an accounts-receivable aging report: invoices grouped into
    /// 0-30, 31-60, 61-90, and 90+ day buckets based on due date.
    /// </summary>
    [HttpGet("aging")]
    [ProducesResponseType(typeof(AgingReportDto), 200)]
    public async Task<IActionResult> Aging()
    {
        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var outstanding = await _db.Invoices
            .Include(i => i.Customer)
            .Where(i => i.BusinessId == businessId
                     && (i.Status == "sent" || i.Status == "partial" || i.Status == "overdue"))
            .Select(i => new AgingInvoiceDto
            {
                InvoiceId       = i.Id,
                InvoiceNumber   = i.InvoiceNumber,
                CustomerName    = i.Customer.Name,
                InvoiceDate     = i.InvoiceDate,
                DueDate         = i.DueDate,
                TotalAmount     = i.TotalAmount,
                AmountPaid      = i.AmountPaid,
                Outstanding     = i.TotalAmount - i.AmountPaid,
                DaysOverdue     = i.DueDate.HasValue
                    ? (today.DayNumber - i.DueDate.Value.DayNumber)
                    : 0
            })
            .ToListAsync();

        var report = new AgingReportDto
        {
            AsOf          = today,
            Current       = outstanding.Where(i => i.DaysOverdue <= 0).ToList(),
            Overdue1To30  = outstanding.Where(i => i.DaysOverdue is >= 1 and <= 30).ToList(),
            Overdue31To60 = outstanding.Where(i => i.DaysOverdue is >= 31 and <= 60).ToList(),
            Overdue61To90 = outstanding.Where(i => i.DaysOverdue is >= 61 and <= 90).ToList(),
            Overdue90Plus = outstanding.Where(i => i.DaysOverdue > 90).ToList()
        };

        return Ok(report);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Product/Item Report
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns sales by product for a date range.
    /// </summary>
    [HttpGet("products")]
    [ProducesResponseType(typeof(List<ProductSalesDto>), 200)]
    public async Task<IActionResult> ProductSales(
        [FromQuery, Required] DateOnly from,
        [FromQuery, Required] DateOnly to)
    {
        if (to < from)
            return BadRequest("'to' must be on or after 'from'.");

        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var result = await _db.InvoiceItems
            .Include(it => it.Invoice)
            .Include(it => it.Product)
            .Where(it => it.Invoice.BusinessId == businessId
                      && it.Invoice.InvoiceDate >= from
                      && it.Invoice.InvoiceDate <= to
                      && it.Invoice.Status != "cancelled")
            .GroupBy(it => new { it.ProductId, Name = it.Product != null ? it.Product.Name : it.Description })
            .Select(g => new ProductSalesDto
            {
                ProductId    = g.Key.ProductId,
                ProductName  = g.Key.Name,
                TotalQty     = g.Sum(it => it.Quantity),
                TotalTaxable = g.Sum(it => it.TaxableAmount),
                TotalTax     = g.Sum(it => it.CgstAmount + it.SgstAmount + it.IgstAmount),
                TotalAmount  = g.Sum(it => it.TotalAmount)
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToListAsync();

        return Ok(result);
    }
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public class GstR1ReportDto
{
    public int Year  { get; set; }
    public int Month { get; set; }
    public GstTaxSummary         InterStateSummary  { get; set; } = new();
    public GstTaxSummary         IntraStateSummary  { get; set; } = new();
    public List<GstR1InvoiceDto> Invoices           { get; set; } = new();
}

public class GstTaxSummary
{
    public int?     InvoiceCount { get; set; }
    public decimal? Taxable      { get; set; }
    public decimal? CgstAmount   { get; set; }
    public decimal? SgstAmount   { get; set; }
    public decimal? IgstAmount   { get; set; }
    public decimal? TotalTax     { get; set; }
    public decimal? TotalAmount  { get; set; }
}

public class GstR1InvoiceDto
{
    public Guid?     InvoiceId     { get; set; }
    public string?   InvoiceNumber { get; set; } = default!;
    public DateOnly? InvoiceDate   { get; set; }
    public string?  CustomerName  { get; set; }
    public string?  CustomerGstin { get; set; }
    public bool?     IsInterState  { get; set; }
    public string?  PlaceOfSupply { get; set; }
    public decimal?  Taxable       { get; set; }
    public decimal?  CgstAmount    { get; set; }
    public decimal?  SgstAmount    { get; set; }
    public decimal?  IgstAmount    { get; set; }
    public decimal?  TotalTax      { get; set; }
    public decimal?  TotalAmount   { get; set; }
}

public class SalesReportDto
{
    public DateOnly? From             { get; set; }
    public DateOnly? To               { get; set; }
    public decimal?  TotalInvoiced    { get; set; }
    public decimal?  TotalPaid        { get; set; }
    public decimal?  TotalOutstanding { get; set; }
    public decimal?  TotalTax         { get; set; }
    public int?      InvoiceCount     { get; set; }
    public List<SalesByCustomerDto> ByCustomer { get; set; } = new();
}

public class SalesByCustomerDto
{
    public Guid    CustomerId       { get; set; }
    public string?  CustomerName     { get; set; } = default!;
    public int?     InvoiceCount     { get; set; }
    public decimal? TotalInvoiced    { get; set; }
    public decimal? TotalPaid        { get; set; }
    public decimal? TotalOutstanding { get; set; }
}

public class AgingReportDto
{
    public DateOnly AsOf           { get; set; }
    public List<AgingInvoiceDto> Current       { get; set; } = new();
    public List<AgingInvoiceDto> Overdue1To30  { get; set; } = new();
    public List<AgingInvoiceDto> Overdue31To60 { get; set; } = new();
    public List<AgingInvoiceDto> Overdue61To90 { get; set; } = new();
    public List<AgingInvoiceDto> Overdue90Plus { get; set; } = new();
}

public class AgingInvoiceDto
{
    public Guid      InvoiceId     { get; set; }
    public string?    InvoiceNumber { get; set; } = default!;
    public string?    CustomerName  { get; set; } = default!;
    public DateOnly?  InvoiceDate   { get; set; }
    public DateOnly? DueDate       { get; set; }
    public decimal?   TotalAmount   { get; set; }
    public decimal?   AmountPaid    { get; set; }
    public decimal?   Outstanding   { get; set; }
    public int?       DaysOverdue   { get; set; }
}

public class ProductSalesDto
{
    public Guid?   ProductId    { get; set; }
    public string?  ProductName  { get; set; } = default!;
    public decimal? TotalQty     { get; set; }
    public decimal? TotalTaxable { get; set; }
    public decimal? TotalTax     { get; set; }
    public decimal? TotalAmount  { get; set; }
}
