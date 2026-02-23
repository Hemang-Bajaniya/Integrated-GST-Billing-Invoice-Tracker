// Controllers/PaymentsController.cs
using InvoiceFlow.Infrastructure.Context;
using InvoiceFlow.Infrastructure.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace InvoiceFlow.API.Controllers;

[ApiController]
[Route("api/invoices/{invoiceId:guid}/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly GstInvoiceTrackerDbContext _db;

    public PaymentsController(GstInvoiceTrackerDbContext db) => _db = db;

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

    private async Task<Invoice?> GetInvoiceForUserAsync(Guid invoiceId)
    {
        var businessId = await GetUserBusinessIdAsync();
        return await _db.Invoices
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.BusinessId == businessId);
    }

    /// <summary>Returns all payments for a given invoice.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<PaymentDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetAll(Guid invoiceId)
    {
        var invoice = await GetInvoiceForUserAsync(invoiceId);
        if (invoice is null)
            return NotFound("Invoice not found.");

        var payments = await _db.Payments
            .Where(p => p.InvoiceId == invoiceId)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => MapToDto(p))
            .ToListAsync();

        return Ok(payments);
    }

    /// <summary>Returns a single payment by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PaymentDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Get(Guid invoiceId, Guid id)
    {
        var invoice = await GetInvoiceForUserAsync(invoiceId);
        if (invoice is null)
            return NotFound("Invoice not found.");

        var payment = await _db.Payments
            .Where(p => p.Id == id && p.InvoiceId == invoiceId)
            .Select(p => MapToDto(p))
            .FirstOrDefaultAsync();

        if (payment is null)
            return NotFound();

        return Ok(payment);
    }

    /// <summary>Records a new payment against an invoice and recalculates the invoice status.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Accountant")]
    [ProducesResponseType(typeof(PaymentDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Create(Guid invoiceId, [FromBody] CreatePaymentRequest request)
    {
        var invoice = await GetInvoiceForUserAsync(invoiceId);
        if (invoice is null)
            return NotFound("Invoice not found.");

        if (invoice.Status == "cancelled")
            return BadRequest("Cannot record payment for a cancelled invoice.");

        var outstanding = invoice.TotalAmount - invoice.AmountPaid;
        if (request.Amount <= 0)
            return BadRequest("Payment amount must be greater than zero.");
        if (request.Amount > outstanding)
            return BadRequest($"Payment amount ({request.Amount:C}) exceeds outstanding balance ({outstanding:C}).");

        var payment = new Payment
        {
            Id              = Guid.NewGuid(),
            InvoiceId       = invoiceId,
            Amount          = request.Amount,
            PaymentDate     = request.PaymentDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            PaymentMethod   = request.PaymentMethod,
            Status          = "Completed",
            ReferenceNumber = request.ReferenceNumber,
            Notes           = request.Notes,
            CreatedBy       = GetUserId(),
            CreatedAt       = DateTime.UtcNow
        };

        _db.Payments.Add(payment);

        // Update invoice paid amount and status
        invoice.AmountPaid += request.Amount;
        invoice.Status      = invoice.AmountPaid >= invoice.TotalAmount
            ? "paid"
            : "partial";
        invoice.UpdatedAt   = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { invoiceId, id = payment.Id }, MapToDto(payment));
    }

    /// <summary>Deletes a payment and reverses the paid amount on the invoice.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid invoiceId, Guid id)
    {
        var invoice = await GetInvoiceForUserAsync(invoiceId);
        if (invoice is null)
            return NotFound("Invoice not found.");

        var payment = await _db.Payments
            .FirstOrDefaultAsync(p => p.Id == id && p.InvoiceId == invoiceId);

        if (payment is null)
            return NotFound();

        _db.Payments.Remove(payment);

        // Reverse the payment on the invoice
        invoice.AmountPaid = Math.Max(0, (invoice.AmountPaid ?? 0) - payment.Amount);
        invoice.Status     = invoice.AmountPaid <= 0
            ? "sent"
            : invoice.AmountPaid < invoice.TotalAmount
                ? "partial"
                : "paid";
        invoice.UpdatedAt  = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static PaymentDto MapToDto(Payment p) => new()
    {
        Id              = p.Id,
        InvoiceId       = p.InvoiceId,
        Amount          = p.Amount,
        PaymentDate     = p.PaymentDate,
        PaymentMethod   = p.PaymentMethod,
        Status          = p.Status,
        ReferenceNumber = p.ReferenceNumber,
        Notes           = p.Notes,
        CreatedBy       = p.CreatedBy,
        CreatedAt       = p.CreatedAt
    };
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public class PaymentDto
{
    public Guid     Id              { get; set; }
    public Guid     InvoiceId       { get; set; }
    public decimal  Amount          { get; set; }
    public DateOnly PaymentDate     { get; set; }
    public string?  PaymentMethod   { get; set; }
    public string?  Status          { get; set; }
    public string?  ReferenceNumber { get; set; }
    public string?  Notes           { get; set; }
    public Guid?    CreatedBy       { get; set; }
    public DateTime? CreatedAt       { get; set; }
}

public class CreatePaymentRequest
{
    [Required, Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
    public decimal  Amount          { get; set; }
    public DateOnly? PaymentDate    { get; set; }
    /// <summary>cash | bank | upi | card | cheque</summary>
    public string?  PaymentMethod   { get; set; }
    public string?  ReferenceNumber { get; set; }
    public string?  Notes           { get; set; }
}
