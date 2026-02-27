// Controllers/DashboardController.cs
using InvoiceFlow.Infrastructure.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace InvoiceFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly GstInvoiceTrackerDbContext _db;

    public DashboardController(GstInvoiceTrackerDbContext db) => _db = db;

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

    /// <summary>
    /// Returns a summary of key metrics for the authenticated user's business:
    /// revenue, outstanding, overdue, invoice counts, top customers, and monthly trend.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(DashboardSummaryDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> GetSummary()
    {
        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var today     = DateOnly.FromDateTime(DateTime.UtcNow);
        var startOfFY = today.Month >= 4
            ? new DateOnly(today.Year,     4, 1)
            : new DateOnly(today.Year - 1, 4, 1);

        // All invoices for business in current FY
        var invoices = await _db.Invoices
            .Where(i => i.BusinessId == businessId && i.InvoiceDate >= startOfFY)
            .Select(i => new
            {
                i.Status,
                i.TotalAmount,
                i.AmountPaid,
                i.DueDate,
                i.InvoiceDate,
                i.CustomerId
            })
            .ToListAsync();

        var totalRevenue     = invoices.Where(i => i.Status == "paid").Sum(i => i.TotalAmount);
        var totalOutstanding = invoices.Where(i => i.Status is "sent" or "partial")
                                       .Sum(i => i.TotalAmount - i.AmountPaid);
        var totalOverdue     = invoices.Where(i => i.DueDate < today && i.Status is "sent" or "partial" or "overdue")
                                       .Sum(i => i.TotalAmount - i.AmountPaid);

        var statusCounts = invoices
            .GroupBy(i => i.Status)
            .ToDictionary(g => g.Key, g => g.Count());

        // Monthly revenue trend (last 6 months)
        var sixMonthsAgo = today.AddMonths(-5);
        var monthlyTrend = invoices
            .Where(i => i.InvoiceDate >= sixMonthsAgo)
            .GroupBy(i => new { i.InvoiceDate.Year, i.InvoiceDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new MonthlyRevenueDto
            {
                Year     = g.Key.Year,
                Month    = g.Key.Month,
                Revenue  = g.Where(i => i.Status == "paid").Sum(i => i.TotalAmount),
                Invoiced = g.Sum(i => i.TotalAmount)
            })
            .ToList();

        // Top 5 customers by revenue
        var topCustomerIds = invoices
            .GroupBy(i => i.CustomerId)
            .OrderByDescending(g => g.Sum(i => i.AmountPaid))
            .Take(5)
            .Select(g => g.Key)
            .ToList();

        var topCustomers = await _db.Customers
            .Where(c => topCustomerIds.Contains(c.Id))
            .Select(c => new TopCustomerDto
            {
                Id   = c.Id,
                Name = c.Name
            })
            .ToListAsync();

        // Attach revenue totals
        foreach (var tc in topCustomers)
            tc.TotalRevenue = invoices
                .Where(i => i.CustomerId == tc.Id)
                .Sum(i => i.AmountPaid);

        var summary = new DashboardSummaryDto
        {
            TotalRevenueFY     = totalRevenue,
            TotalOutstanding   = totalOutstanding,
            TotalOverdue       = totalOverdue,
            TotalInvoices      = invoices.Count,
            StatusBreakdown    = statusCounts,
            MonthlyTrend       = monthlyTrend,
            TopCustomers       = topCustomers.OrderByDescending(c => c.TotalRevenue).ToList(),
            ActiveCustomers    = await _db.Customers.CountAsync(c => c.BusinessId == businessId && c.IsActive),
            ActiveProducts     = await _db.Products.CountAsync(p => p.BusinessId == businessId && p.IsActive)
        };

        return Ok(summary);
    }

    /// <summary>Returns invoice counts grouped by status for the current user's business.</summary>
    [HttpGet("status-counts")]
    [ProducesResponseType(typeof(Dictionary<string, int>), 200)]
    public async Task<IActionResult> GetStatusCounts()
    {
        var businessId = await GetUserBusinessIdAsync();
        if (businessId is null)
            return BadRequest("User has no business profile.");

        var counts = await _db.Invoices
            .Where(i => i.BusinessId == businessId)
            .GroupBy(i => i.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count);

        return Ok(counts);
    }
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public class DashboardSummaryDto
{
    public decimal? TotalRevenueFY   { get; set; }
    public decimal? TotalOutstanding { get; set; }
    public decimal? TotalOverdue     { get; set; }
    public int?     TotalInvoices    { get; set; }
    public int?     ActiveCustomers  { get; set; }
    public int?     ActiveProducts   { get; set; }
    public Dictionary<string, int>  StatusBreakdown { get; set; } = new();
    public List<MonthlyRevenueDto>  MonthlyTrend    { get; set; } = new();
    public List<TopCustomerDto>     TopCustomers    { get; set; } = new();
}

public class MonthlyRevenueDto
{
    public int?     Year     { get; set; }
    public int?     Month    { get; set; }
    public decimal? Revenue  { get; set; }
    public decimal? Invoiced { get; set; }
}

public class TopCustomerDto
{
    public Guid    Id           { get; set; }
    public string?  Name         { get; set; } = default!;
    public decimal? TotalRevenue { get; set; }
}
