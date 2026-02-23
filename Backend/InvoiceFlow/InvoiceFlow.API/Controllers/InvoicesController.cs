// Controllers/InvoicesController.cs
using InvoiceFlow.Infrastructure.Context;
using InvoiceFlow.Infrastructure.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace InvoiceFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly GstInvoiceTrackerDbContext _db;

    public InvoicesController(GstInvoiceTrackerDbContext db) => _db = db;

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<(Guid? businessId, BusinessProfile? business)> GetUserBusinessAsync()
    {
        var userId = GetUserId();
        var user = await _db.AuthUsers
            .Include(u => u.BusinessProfile)
            .FirstOrDefaultAsync(u => u.Id == userId);
        return (user?.BusinessProfileId, user?.BusinessProfile);
    }

    /// <summary>Returns all invoices with optional search and status filter.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<InvoiceSummaryDto>), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status)
    {
        var (businessId, _) = await GetUserBusinessAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var query = _db.Invoices
            .Include(i => i.Customer)
            .Where(i => i.BusinessId == businessId);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(i => i.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(i =>
                i.InvoiceNumber.Contains(search) ||
                i.Customer.Name.Contains(search));

        var invoices = await query
            .OrderByDescending(i => i.InvoiceDate)
            .Select(i => new InvoiceSummaryDto
            {
                Id            = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CustomerName  = i.Customer.Name,
                CustomerId    = i.CustomerId,
                InvoiceDate   = i.InvoiceDate,
                DueDate       = i.DueDate,
                TotalAmount   = i.TotalAmount,
                AmountPaid    = i.AmountPaid,
                Status        = i.Status,
                InvoiceType   = i.InvoiceType
            })
            .ToListAsync();

        return Ok(invoices);
    }

    /// <summary>Returns a single invoice with full line items.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(InvoiceDetailDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Get(Guid id)
    {
        var (businessId, _) = await GetUserBusinessAsync();

        var invoice = await _db.Invoices
            .Include(i => i.Customer)
            .Include(i => i.InvoiceItems)
                .ThenInclude(it => it.GstRate)
            .FirstOrDefaultAsync(i => i.Id == id && i.BusinessId == businessId);

        if (invoice is null)
            return NotFound();

        return Ok(MapToDetailDto(invoice));
    }

    /// <summary>
    /// Creates a new invoice. Automatically calculates CGST/SGST (intra-state)
    /// or IGST (inter-state) based on the business and customer states.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Accountant")]
    [ProducesResponseType(typeof(InvoiceDetailDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request)
    {
        var (businessId, business) = await GetUserBusinessAsync();
        if (businessId is null || business is null)
            return BadRequest("User has no business profile.");

        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Id == request.CustomerId && c.BusinessId == businessId);
        if (customer is null)
            return BadRequest("Customer not found.");

        if (!request.Items.Any())
            return BadRequest("Invoice must have at least one line item.");

        // Validate all GstRateIds exist
        var gstRateIds = request.Items.Select(i => i.GstRateId).Distinct().ToList();
        var gstRates   = await _db.GstRates
            .Where(r => gstRateIds.Contains(r.Id))
            .ToDictionaryAsync(r => r.Id, r => r.Rate);

        foreach (var rateId in gstRateIds)
            if (!gstRates.ContainsKey(rateId))
                return BadRequest($"Invalid GST rate ID: {rateId}");

        bool isInterState = !string.IsNullOrWhiteSpace(customer.State) &&
                            !string.IsNullOrWhiteSpace(business.State) &&
                            customer.State != business.State;

        // Generate invoice number
        var invoiceNumber = $"{business.InvoicePrefix}-{business.InvoiceCounter:D4}";

        // Build line items & calculate totals
        var items      = new List<InvoiceItem>();
        decimal subtotal    = 0;
        decimal totalCgst   = 0;
        decimal totalSgst   = 0;
        decimal totalIgst   = 0;

        foreach (var req in request.Items)
        {
            var gstRate   = gstRates[req.GstRateId];
            var taxable   = Math.Round(req.Quantity * req.UnitPrice * (1 - (req.DiscountPercent ?? 0) / 100), 2);
            decimal cgst  = 0, sgst = 0, igst = 0;

            if (isInterState)
                igst = Math.Round(taxable * gstRate / 100, 2);
            else
            {
                cgst = Math.Round(taxable * gstRate / 200, 2);
                sgst = Math.Round(taxable * gstRate / 200, 2);
            }

            var lineTotal = taxable + cgst + sgst + igst;

            items.Add(new InvoiceItem
            {
                Id             = Guid.NewGuid(),
                ProductId      = req.ProductId,
                Description    = req.Description,
                HsnSacCode     = req.HsnSacCode,
                Quantity       = req.Quantity,
                Unit           = req.Unit ?? "NOS",
                UnitPrice      = req.UnitPrice,
                DiscountPercent = req.DiscountPercent ?? 0,
                TaxableAmount  = taxable,
                GstRateId      = req.GstRateId,
                CgstAmount     = cgst,
                SgstAmount     = sgst,
                IgstAmount     = igst,
                TotalAmount    = lineTotal,
                CreatedAt      = DateTime.UtcNow
            });

            subtotal  += taxable;
            totalCgst += cgst;
            totalSgst += sgst;
            totalIgst += igst;
        }

        var invoice = new Invoice
        {
            Id            = Guid.NewGuid(),
            BusinessId    = businessId.Value,
            CustomerId    = request.CustomerId,
            InvoiceNumber = invoiceNumber,
            InvoiceType   = request.InvoiceType ?? "tax_invoice",
            InvoiceDate   = request.InvoiceDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            DueDate       = request.DueDate,
            PlaceOfSupply = request.PlaceOfSupply ?? customer.State,
            IsInterState  = isInterState,
            Subtotal      = subtotal,
            CgstAmount    = totalCgst,
            SgstAmount    = totalSgst,
            IgstAmount    = totalIgst,
            TotalTax      = totalCgst + totalSgst + totalIgst,
            TotalAmount   = subtotal  + totalCgst + totalSgst + totalIgst,
            AmountPaid    = 0,
            Status        = "draft",
            Notes         = request.Notes,
            Terms         = request.Terms,
            CreatedBy     = GetUserId(),
            CreatedAt     = DateTime.UtcNow,
            UpdatedAt     = DateTime.UtcNow,
            InvoiceItems         = items
        };

        _db.Invoices.Add(invoice);

        // Increment business invoice counter atomically
        business.InvoiceCounter++;

        await _db.SaveChangesAsync();

        await _db.Entry(invoice)
            .Collection(i => i.InvoiceItems)
            .Query()
            .Include(it => it.GstRate)
            .LoadAsync();

        await _db.Entry(invoice).Reference(i => i.Customer).LoadAsync();

        return CreatedAtAction(nameof(Get), new { id = invoice.Id }, MapToDetailDto(invoice));
    }

    /// <summary>Updates the status of an invoice (e.g. draft → sent → paid).</summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin,Accountant")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateInvoiceStatusRequest request)
    {
        var (businessId, _) = await GetUserBusinessAsync();

        var invoice = await _db.Invoices
            .FirstOrDefaultAsync(i => i.Id == id && i.BusinessId == businessId);

        if (invoice is null)
            return NotFound();

        var allowed = new[] { "draft", "sent", "paid", "partial", "overdue", "cancelled" };
        if (!allowed.Contains(request.Status))
            return BadRequest($"Invalid status. Allowed values: {string.Join(", ", allowed)}");

        invoice.Status    = request.Status;
        invoice.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>Cancels an invoice.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var (businessId, _) = await GetUserBusinessAsync();

        var invoice = await _db.Invoices
            .FirstOrDefaultAsync(i => i.Id == id && i.BusinessId == businessId);

        if (invoice is null)
            return NotFound();

        invoice.Status    = "cancelled";
        invoice.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static InvoiceDetailDto MapToDetailDto(Invoice i) => new()
    {
        Id            = i.Id,
        BusinessId    = i.BusinessId,
        CustomerId    = i.CustomerId,
        CustomerName  = i.Customer?.Name,
        InvoiceNumber = i.InvoiceNumber,
        InvoiceType   = i.InvoiceType,
        InvoiceDate   = i.InvoiceDate,
        DueDate       = i.DueDate,
        PlaceOfSupply = i.PlaceOfSupply,
        IsInterState  = i.IsInterState,
        Subtotal      = i.Subtotal,
        CgstAmount    = i.CgstAmount,
        SgstAmount    = i.SgstAmount,
        IgstAmount    = i.IgstAmount,
        TotalTax      = i.TotalTax,
        TotalAmount   = i.TotalAmount,
        AmountPaid    = i.AmountPaid,
        Status        = i.Status,
        Notes         = i.Notes,
        Terms         = i.Terms,
        CreatedAt     = i.CreatedAt,
        UpdatedAt     = i.UpdatedAt,
        Items         = i.InvoiceItems?.Select(it => new InvoiceItemDto
        {
            Id              = it.Id,
            ProductId       = it.ProductId,
            Description     = it.Description,
            HsnSacCode      = it.HsnSacCode,
            Quantity        = it.Quantity,
            Unit            = it.Unit,
            UnitPrice       = it.UnitPrice,
            DiscountPercent = it.DiscountPercent,
            TaxableAmount   = it.TaxableAmount,
            GstRateId       = it.GstRateId,
            GstRate         = it.GstRate?.Rate,
            CgstAmount      = it.CgstAmount,
            SgstAmount      = it.SgstAmount,
            IgstAmount      = it.IgstAmount,
            TotalAmount     = it.TotalAmount
        }).ToList() ?? new()
    };
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public class InvoiceSummaryDto
{
    public Guid     Id            { get; set; }
    public string   InvoiceNumber { get; set; } = default!;
    public Guid     CustomerId    { get; set; }
    public string?  CustomerName  { get; set; }
    public DateOnly InvoiceDate   { get; set; }
    public DateOnly? DueDate      { get; set; }
    public decimal?  TotalAmount   { get; set; }
    public decimal?  AmountPaid    { get; set; }
    public string   Status        { get; set; } = default!;
    public string   InvoiceType   { get; set; } = default!;
}

public class InvoiceDetailDto : InvoiceSummaryDto
{
    public Guid     BusinessId    { get; set; }
    public string?  PlaceOfSupply { get; set; }
    public bool?     IsInterState  { get; set; }
    public decimal?  Subtotal      { get; set; }
    public decimal?  CgstAmount    { get; set; }
    public decimal?  SgstAmount    { get; set; }
    public decimal?  IgstAmount    { get; set; }
    public decimal?  TotalTax      { get; set; }
    public string?  Notes         { get; set; }
    public string?  Terms         { get; set; }
    public DateTime? CreatedAt     { get; set; }
    public DateTime? UpdatedAt     { get; set; }
    public List<InvoiceItemDto> Items { get; set; } = new();
}

public class InvoiceItemDto
{
    public Guid    Id              { get; set; }
    public Guid?   ProductId       { get; set; }
    public string?  Description     { get; set; } = default!;
    public string? HsnSacCode      { get; set; }
    public decimal? Quantity        { get; set; }
    public string?  Unit            { get; set; } = "NOS";
    public decimal? UnitPrice       { get; set; }
    public decimal? DiscountPercent { get; set; }
    public decimal? TaxableAmount   { get; set; }
    public Guid    GstRateId       { get; set; }
    public decimal? GstRate        { get; set; }
    public decimal? CgstAmount      { get; set; }
    public decimal? SgstAmount      { get; set; }
    public decimal? IgstAmount      { get; set; }
    public decimal? TotalAmount     { get; set; }
}

public class CreateInvoiceRequest
{
    [Required]
    public Guid    CustomerId    { get; set; }
    public string? InvoiceType   { get; set; }
    public DateOnly? InvoiceDate { get; set; }
    public DateOnly? DueDate     { get; set; }
    public string? PlaceOfSupply { get; set; }
    public string? Notes         { get; set; }
    public string? Terms         { get; set; }

    [Required, MinLength(1)]
    public List<CreateInvoiceItemRequest> Items { get; set; } = new();
}

public class CreateInvoiceItemRequest
{
    public Guid?   ProductId       { get; set; }
    [Required, MaxLength(500)]
    public string  Description     { get; set; } = default!;
    public string? HsnSacCode      { get; set; }
    [Required, Range(0.001, double.MaxValue)]
    public decimal Quantity        { get; set; } = 1;
    [MaxLength(20)]
    public string? Unit            { get; set; }
    [Required, Range(0, double.MaxValue)]
    public decimal UnitPrice       { get; set; }
    [Range(0, 100)]
    public decimal? DiscountPercent { get; set; }
    [Required]
    public Guid    GstRateId       { get; set; }
}

public class UpdateInvoiceStatusRequest
{
    [Required]
    public string Status { get; set; } = default!;
}
