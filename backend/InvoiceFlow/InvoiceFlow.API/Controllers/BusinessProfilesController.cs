// Controllers/BusinessProfilesController.cs
using InvoiceFlow.Infrastructure.Context;
using InvoiceFlow.Infrastructure.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Security.Claims;

namespace InvoiceFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BusinessProfilesController : ControllerBase
{
    private readonly GstInvoiceTrackerDbContext _db;

    public BusinessProfilesController(GstInvoiceTrackerDbContext db) => _db = db;

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Gets the business profile for the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(BusinessProfileDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Get()
    {
        var userId = GetUserId();

        var profile = await _db.BusinessProfiles
            .Where(b => b.AuthUsers.Any(u => u.Id == userId))
            .Select(b => new BusinessProfileDto
            {
                Id            = b.Id,
                Name          = b.Name,
                Gstin         = b.Gstin,
                Pan           = b.Pan,
                AddressLine1  = b.AddressLine1,
                AddressLine2  = b.AddressLine2,
                City          = b.City,
                State         = b.State,
                Pincode       = b.Pincode,
                Phone         = b.Phone,
                Email         = b.Email,
                BankName      = b.BankName,
                BankAccountNumber = b.BankAccountNumber,
                BankIfsc      = b.BankIfsc,
                InvoicePrefix = b.InvoicePrefix,
                InvoiceCounter = b.InvoiceCounter,
                CreatedAt     = b.CreatedAt,
                UpdatedAt     = b.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (profile is null)
            return NotFound("No business profile found for this user.");

        return Ok(profile);
    }

    /// <summary>Gets a business profile by its ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BusinessProfileDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = GetUserId();

        var profile = await _db.BusinessProfiles
            .Where(b => b.Id == id && b.AuthUsers.Any(u => u.Id == userId))
            .Select(b => new BusinessProfileDto
            {
                Id            = b.Id,
                Name          = b.Name,
                Gstin         = b.Gstin,
                Pan           = b.Pan,
                AddressLine1  = b.AddressLine1,
                AddressLine2  = b.AddressLine2,
                City          = b.City,
                State         = b.State,
                Pincode       = b.Pincode,
                Phone         = b.Phone,
                Email         = b.Email,
                BankName      = b.BankName,
                BankAccountNumber = b.BankAccountNumber,
                BankIfsc      = b.BankIfsc,
                InvoicePrefix = b.InvoicePrefix,
                InvoiceCounter = b.InvoiceCounter,
                CreatedAt     = b.CreatedAt,
                UpdatedAt     = b.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (profile is null)
            return NotFound();

        return Ok(profile);
    }

    /// <summary>Creates a new business profile and links it to the authenticated user.</summary>
    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(BusinessProfileDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] UpsertBusinessProfileRequest request)
    {
        var userId = GetUserId();

        var user = await _db.AuthUsers.FindAsync(userId);
        if (user is null)
            return Unauthorized();

        var business = new BusinessProfile
        {
            Id               = Guid.NewGuid(),
            Name             = request.Name,
            Gstin            = request.Gstin,
            Pan              = request.Pan,
            AddressLine1     = request.AddressLine1,
            AddressLine2     = request.AddressLine2,
            City             = request.City,
            State            = request.State,
            Pincode          = request.Pincode,
            Phone            = request.Phone,
            Email            = request.Email,
            BankName         = request.BankName,
            BankAccountNumber = request.BankAccountNumber,
            BankIfsc         = request.BankIfsc,
            InvoicePrefix    = request.InvoicePrefix ?? "INV",
            InvoiceCounter   = 1,
            CreatedAt        = DateTime.UtcNow,
            UpdatedAt        = DateTime.UtcNow
        };

        _db.BusinessProfiles.Add(business);

        // Link to user
        user.BusinessProfileId = business.Id;

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = business.Id }, MapToDto(business));
    }

    /// <summary>Updates an existing business profile.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertBusinessProfileRequest request)
    {
        var userId = GetUserId();

        var business = await _db.BusinessProfiles
            .Where(b => b.Id == id && b.AuthUsers.Any(u => u.Id == userId))
            .FirstOrDefaultAsync();

        if (business is null)
            return NotFound();

        business.Name             = request.Name;
        business.Gstin            = request.Gstin;
        business.Pan              = request.Pan;
        business.AddressLine1     = request.AddressLine1;
        business.AddressLine2     = request.AddressLine2;
        business.City             = request.City;
        business.State            = request.State;
        business.Pincode          = request.Pincode;
        business.Phone            = request.Phone;
        business.Email            = request.Email;
        business.BankName         = request.BankName;
        business.BankAccountNumber = request.BankAccountNumber;
        business.BankIfsc         = request.BankIfsc;
        business.InvoicePrefix    = request.InvoicePrefix ?? business.InvoicePrefix;
        business.UpdatedAt        = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static BusinessProfileDto MapToDto(BusinessProfile b) => new()
    {
        Id               = b.Id,
        Name             = b.Name,
        Gstin            = b.Gstin,
        Pan              = b.Pan,
        AddressLine1     = b.AddressLine1,
        AddressLine2     = b.AddressLine2,
        City             = b.City,
        State            = b.State,
        Pincode          = b.Pincode,
        Phone            = b.Phone,
        Email            = b.Email,
        BankName         = b.BankName,
        BankAccountNumber = b.BankAccountNumber,
        BankIfsc         = b.BankIfsc,
        InvoicePrefix    = b.InvoicePrefix,
        InvoiceCounter   = b.InvoiceCounter,
        CreatedAt        = b.CreatedAt,
        UpdatedAt        = b.UpdatedAt
    };
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public class BusinessProfileDto
{
    public Guid?    Id               { get; set; }
    public string  Name             { get; set; } = default!;
    public string? Gstin            { get; set; }
    public string? Pan              { get; set; }
    public string? AddressLine1     { get; set; }
    public string? AddressLine2     { get; set; }
    public string? City             { get; set; }
    public string? State            { get; set; }
    public string? Pincode          { get; set; }
    public string? Phone            { get; set; }
    public string? Email            { get; set; }
    public string? BankName         { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankIfsc         { get; set; }
    public string?  InvoicePrefix    { get; set; } = "INV";
    public int?     InvoiceCounter   { get; set; }
    public DateTime? CreatedAt       { get; set; }
    public DateTime? UpdatedAt       { get; set; }
}

public class UpsertBusinessProfileRequest
{
    [Required, MaxLength(255)]
    public string?  Name             { get; set; } = default!;
    [MaxLength(15)]
    public string? Gstin            { get; set; }
    [MaxLength(10)]
    public string? Pan              { get; set; }
    public string? AddressLine1     { get; set; }
    public string? AddressLine2     { get; set; }
    public string? City             { get; set; }
    [MaxLength(2)]
    public string? State            { get; set; }
    public string? Pincode          { get; set; }
    public string? Phone            { get; set; }
    [EmailAddress]
    public string? Email            { get; set; }
    public string? BankName         { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankIfsc         { get; set; }
    [MaxLength(50)]
    public string? InvoicePrefix    { get; set; }
}
