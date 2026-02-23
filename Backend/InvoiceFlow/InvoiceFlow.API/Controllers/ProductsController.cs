// Controllers/ProductsController.cs
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
public class ProductsController : ControllerBase
{
    private readonly GstInvoiceTrackerDbContext _db;

    public ProductsController(GstInvoiceTrackerDbContext db) => _db = db;

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

    /// <summary>Returns all products for the authenticated user's business, with optional search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ProductDto>), 200)]
    public async Task<IActionResult> GetAll(
    [FromQuery] string? search,
    [FromQuery] bool includeInactive = false)
    {
        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        IQueryable<Product> query = _db.Products
                                        .Where(p => p.BusinessId == businessId)
                                        .Include(p => p.GstRate);

        if (!includeInactive)
            query = query.Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p =>
                p.Name.Contains(search) ||
                (p.HsnSacCode != null && p.HsnSacCode.Contains(search)));

        var products = await query
            .OrderBy(p => p.Name)
            .Select(p => MapToDto(p))
            .ToListAsync();

        return Ok(products);
    }


    /// <summary>Returns a single product by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Get(Guid id)
    {
        var businessId = await GetUserBusinessIdAsync();

        var product = await _db.Products
            .Include(p => p.GstRate)
            .Where(p => p.Id == id && p.BusinessId == businessId)
            .Select(p => MapToDto(p))
            .FirstOrDefaultAsync();

        if (product is null)
            return NotFound();

        return Ok(product);
    }

    /// <summary>Creates a new product under the authenticated user's business.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Accountant")]
    [ProducesResponseType(typeof(ProductDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] UpsertProductRequest request)
    {
        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var gstRateExists = await _db.GstRates.AnyAsync(r => r.Id == request.GstRateId);
        if (!gstRateExists)
            return BadRequest("Invalid GST rate ID.");

        var product = new Product
        {
            Id          = Guid.NewGuid(),
            BusinessId  = businessId.Value,
            Name        = request.Name,
            Description = request.Description,
            HsnSacCode  = request.HsnSacCode,
            Unit        = request.Unit ?? "NOS",
            UnitPrice   = request.UnitPrice,
            GstRateId   = request.GstRateId,
            IsService   = request.IsService,
            IsActive    = true,
            CreatedAt   = DateTime.UtcNow,
            UpdatedAt   = DateTime.UtcNow
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        await _db.Entry(product).Reference(p => p.GstRate).LoadAsync();

        return CreatedAtAction(nameof(Get), new { id = product.Id }, MapToDto(product));
    }

    /// <summary>Updates an existing product.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Accountant")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertProductRequest request)
    {
        var businessId = await GetUserBusinessIdAsync();

        var product = await _db.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.BusinessId == businessId);

        if (product is null)
            return NotFound();

        var gstRateExists = await _db.GstRates.AnyAsync(r => r.Id == request.GstRateId);
        if (!gstRateExists)
            return BadRequest("Invalid GST rate ID.");

        product.Name        = request.Name;
        product.Description = request.Description;
        product.HsnSacCode  = request.HsnSacCode;
        product.Unit        = request.Unit ?? product.Unit;
        product.UnitPrice   = request.UnitPrice;
        product.GstRateId   = request.GstRateId;
        product.IsService   = request.IsService;
        product.UpdatedAt   = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>Deletes a product. Returns 409 if the product is used in any invoice.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var businessId = await GetUserBusinessIdAsync();

        var product = await _db.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.BusinessId == businessId);

        if (product is null)
            return NotFound();

        var usedInInvoice = await _db.InvoiceItems.AnyAsync(i => i.ProductId == id);
        if (usedInInvoice)
            return Conflict("Cannot delete a product that is referenced by existing invoice items. Deactivate it instead.");

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>Returns all available GST rates.</summary>
    [HttpGet("gst-rates")]
    [ProducesResponseType(typeof(List<GstRateDto>), 200)]
    public async Task<IActionResult> GetGstRates()
    {
        var rates = await _db.GstRates
            .OrderBy(r => r.Rate)
            .Select(r => new GstRateDto
            {
                Id            = r.Id,
                Rate          = r.Rate,
                EffectiveFrom = r.EffectiveFrom,
                EffectiveTo   = r.EffectiveTo
            })
            .ToListAsync();

        return Ok(rates);
    }

    private static ProductDto MapToDto(Product p) => new()
    {
        Id          = p.Id,
        BusinessId  = p.BusinessId,
        Name        = p.Name,
        Description = p.Description,
        HsnSacCode  = p.HsnSacCode,
        Unit        = p.Unit,
        UnitPrice   = p.UnitPrice,
        GstRateId   = p.GstRateId,
        GstRate     = p.GstRate?.Rate,
        IsService   = p.IsService,
        IsActive    = p.IsActive,
        CreatedAt   = p.CreatedAt,
        UpdatedAt   = p.UpdatedAt
    };
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public class ProductDto
{
    public Guid     Id          { get; set; }
    public Guid     BusinessId  { get; set; }
    public string   Name        { get; set; } = default!;
    public string?  Description { get; set; }
    public string?  HsnSacCode  { get; set; }
    public string   Unit        { get; set; } = "NOS";
    public decimal  UnitPrice   { get; set; }
    public Guid     GstRateId   { get; set; }
    public decimal? GstRate     { get; set; }
    public bool?     IsService   { get; set; }
    public bool?     IsActive    { get; set; }
    public DateTime? CreatedAt { get; set; } = DateTime.Now;    
    public DateTime? UpdatedAt   { get; set; } = DateTime.Now;
}

public class GstRateDto
{
    public Guid     Id            { get; set; }
    public decimal  Rate          { get; set; }
    public DateOnly? EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo   { get; set; }
}

public class UpsertProductRequest
{
    [Required, MaxLength(255)]
    public string  Name        { get; set; } = default!;
    public string? Description { get; set; }
    public string? HsnSacCode  { get; set; }
    [MaxLength(20)]
    public string? Unit        { get; set; }
    [Required, Range(0, double.MaxValue)]
    public decimal UnitPrice   { get; set; }
    [Required]
    public Guid    GstRateId   { get; set; }
    public bool    IsService   { get; set; }
}
