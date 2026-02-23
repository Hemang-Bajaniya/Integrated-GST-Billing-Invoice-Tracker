// Controllers/VendorsController.cs
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
public class VendorsController : ControllerBase
{
    private readonly GstInvoiceTrackerDbContext _db;

    public VendorsController(GstInvoiceTrackerDbContext db) => _db = db;

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

    /// <summary>Returns all vendors for the authenticated user's business, with optional search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<VendorDto>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] bool includeInactive = false)
    {
        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var query = _db.Vendors.Where(v => v.BusinessId == businessId);

        if (!includeInactive)
            query = query.Where(v => v.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(v =>
                v.Name.Contains(search) ||
                (v.Email != null && v.Email.Contains(search)) ||
                (v.Gstin != null && v.Gstin.Contains(search)));

        var vendors = await query
            .OrderBy(v => v.Name)
            .Select(v => MapToDto(v))
            .ToListAsync();

        return Ok(vendors);
    }

    /// <summary>Returns a single vendor by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(VendorDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Get(Guid id)
    {
        var businessId = await GetUserBusinessIdAsync();

        var vendor = await _db.Vendors
            .Where(v => v.Id == id && v.BusinessId == businessId)
            .Select(v => MapToDto(v))
            .FirstOrDefaultAsync();

        if (vendor is null)
            return NotFound();

        return Ok(vendor);
    }

    /// <summary>Creates a new vendor under the authenticated user's business.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Accountant")]
    [ProducesResponseType(typeof(VendorDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] UpsertVendorRequest request)
    {
        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var vendor = new Vendor
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

        _db.Vendors.Add(vendor);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = vendor.Id }, MapToDto(vendor));
    }

    /// <summary>Updates an existing vendor.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Accountant")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertVendorRequest request)
    {
        var businessId = await GetUserBusinessIdAsync();

        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(v => v.Id == id && v.BusinessId == businessId);

        if (vendor is null)
            return NotFound();

        vendor.Name         = request.Name;
        vendor.Gstin        = request.Gstin;
        vendor.Pan          = request.Pan;
        vendor.AddressLine1 = request.AddressLine1;
        vendor.AddressLine2 = request.AddressLine2;
        vendor.City         = request.City;
        vendor.State        = request.State;
        vendor.Pincode      = request.Pincode;
        vendor.Phone        = request.Phone;
        vendor.Email        = request.Email;
        vendor.UpdatedAt    = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>Deletes a vendor. Soft-deletes if referenced by any records.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var businessId = await GetUserBusinessIdAsync();

        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(v => v.Id == id && v.BusinessId == businessId);

        if (vendor is null)
            return NotFound();

        // Soft delete to preserve data integrity
        vendor.IsActive  = false;
        vendor.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static VendorDto MapToDto(Vendor v) => new()
    {
        Id           = v.Id,
        BusinessId   = v.BusinessId,
        Name         = v.Name,
        Gstin        = v.Gstin,
        Pan          = v.Pan,
        AddressLine1 = v.AddressLine1,
        AddressLine2 = v.AddressLine2,
        City         = v.City,
        State        = v.State,
        Pincode      = v.Pincode,
        Phone        = v.Phone,
        Email        = v.Email,
        IsActive     = v.IsActive,
        CreatedAt    = v.CreatedAt,
        UpdatedAt    = v.UpdatedAt
    };
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public class VendorDto
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

public class UpsertVendorRequest
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
