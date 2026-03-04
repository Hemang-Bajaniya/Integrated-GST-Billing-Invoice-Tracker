// Controllers/CustomersController.cs
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
public class CustomersController : ControllerBase
{
    private readonly GstInvoiceTrackerDbContext _db;

    public CustomersController(GstInvoiceTrackerDbContext db) => _db = db;

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

    /// <summary>Returns all customers for the authenticated user's business, with optional search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<CustomerDto>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] bool includeInactive = false)
    {
        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var query = _db.Customers
            .Where(c => c.BusinessId == businessId);

        if (!includeInactive)
            query = query.Where(c => c.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c =>
                c.Name.Contains(search) ||
                (c.Email != null && c.Email.Contains(search)) ||
                (c.Gstin != null && c.Gstin.Contains(search)));

        var customers = await query
            .OrderBy(c => c.Name)
            .Select(c => MapToDto(c))
            .ToListAsync();

        return Ok(customers);
    }

    /// <summary>Returns a single customer by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CustomerDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Get(Guid id)
    {
        var businessId = await GetUserBusinessIdAsync();

        var customer = await _db.Customers
            .Where(c => c.Id == id && c.BusinessId == businessId)
            .Select(c => MapToDto(c))
            .FirstOrDefaultAsync();

        if (customer is null)
            return NotFound();

        return Ok(customer);
    }

    /// <summary>Creates a new customer under the authenticated user's business.</summary>
    [HttpPost]
    [Authorize(Roles = "admin,accountant")]
    [ProducesResponseType(typeof(CustomerDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] UpsertCustomerRequest request)
    {
        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var customer = new Customer
        {
            Id           = Guid.NewGuid(),
            BusinessId   = businessId.Value,
            Name         = request.Name,
            Gstin        = request.Gstin,
            Pan          = request.Pan,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City         = request.City,
            State        = request.State,
            Pincode      = request.Pincode,
            Phone        = request.Phone,
            Email        = request.Email,
            IsActive     = true,
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = customer.Id }, MapToDto(customer));
    }

    /// <summary>Updates an existing customer.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin,accountant")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertCustomerRequest request)
    {
        var businessId = await GetUserBusinessIdAsync();

        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Id == id && c.BusinessId == businessId);

        if (customer is null)
            return NotFound();

        customer.Name         = request.Name;
        customer.Gstin        = request.Gstin;
        customer.Pan          = request.Pan;
        customer.AddressLine1 = request.AddressLine1;
        customer.AddressLine2 = request.AddressLine2;
        customer.City         = request.City;
        customer.State        = request.State;
        customer.Pincode      = request.Pincode;
        customer.Phone        = request.Phone;
        customer.Email        = request.Email;
        customer.UpdatedAt    = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>Soft-deletes a customer (sets IsActive = false). Hard delete is prevented if invoices exist.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var businessId = await GetUserBusinessIdAsync();

        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Id == id && c.BusinessId == businessId);

        if (customer is null)
            return NotFound();

        var hasInvoices = await _db.Invoices.AnyAsync(i => i.CustomerId == id);
        if (hasInvoices)
        {
            // Soft delete to preserve invoice integrity
            customer.IsActive  = false;
            customer.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        _db.Customers.Remove(customer);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static CustomerDto MapToDto(Customer c) => new()
    {
        Id           = c.Id,
        BusinessId   = c.BusinessId,
        Name         = c.Name,
        Gstin        = c.Gstin,
        Pan          = c.Pan,
        AddressLine1 = c.AddressLine1,
        AddressLine2 = c.AddressLine2,
        City         = c.City,
        State        = c.State,
        Pincode      = c.Pincode,
        Phone        = c.Phone,
        Email        = c.Email,
        IsActive     = c.IsActive,
        CreatedAt    = c.CreatedAt,
        UpdatedAt    = c.UpdatedAt
    };
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public class CustomerDto
{
    public Guid    Id           { get; set; }
    public Guid    BusinessId   { get; set; }
    public string  Name         { get; set; } = default!;
    public string? Gstin        { get; set; }
    public string? Pan          { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City         { get; set; }
    public string? State        { get; set; }
    public string? Pincode      { get; set; }
    public string? Phone        { get; set; }
    public string? Email        { get; set; }
    public bool?    IsActive     { get; set; }
    public DateTime? CreatedAt   { get; set; }
    public DateTime? UpdatedAt   { get; set; }
}

public class UpsertCustomerRequest
{
    [Required, MaxLength(255)]
    public string  Name         { get; set; } = default!;
    [MaxLength(15)]
    public string? Gstin        { get; set; }
    [MaxLength(10)]
    public string? Pan          { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City         { get; set; }
    [MaxLength(2)]
    public string? State        { get; set; }
    public string? Pincode      { get; set; }
    [Phone]
    public string? Phone        { get; set; }
    [EmailAddress]
    public string? Email        { get; set; }
}
