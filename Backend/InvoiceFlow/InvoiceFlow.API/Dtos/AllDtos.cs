// Models/Dtos.cs
using System.ComponentModel.DataAnnotations;

namespace InvoiceFlow.API.Dtos;

public record BusinessProfileDto
{
    public Guid Id { get; init; }
    [Required, MaxLength(200)] public string Name { get; init; } = "";
    [RegularExpression(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")]
    public string? Gstin { get; init; }
    [RegularExpression(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")]
    public string? Pan { get; init; }
    public string? AddressLine1 { get; init; }
    public string? AddressLine2 { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    [RegularExpression(@"^[1-9][0-9]{5}$")]
    public string? Pincode { get; init; }
    public string? Phone { get; init; }
    [EmailAddress] public string? Email { get; init; }
    public string? BankName { get; init; }
    public string? BankAccountNumber { get; init; }
    public string? BankIfsc { get; init; }
    [MaxLength(10)] public string InvoicePrefix { get; init; } = "INV";
    public int InvoiceCounter { get; init; }
}

public record CustomerDto
{
    public Guid Id { get; init; }
    public Guid BusinessId { get; init; }
    [Required, MinLength(2), MaxLength(200)] public string Name { get; init; } = "";
    public string? Gstin { get; init; }
    public string? Pan { get; init; }
    public string? AddressLine1 { get; init; }
    public string? AddressLine2 { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Pincode { get; init; }
    public string? Phone { get; init; }
    [EmailAddress] public string? Email { get; init; }
    public bool IsActive { get; init; } = true;
}

public record VendorDto
{
    public Guid Id { get; init; }
    public Guid BusinessId { get; init; }
    [Required, MinLength(2), MaxLength(200)] public string Name { get; init; } = "";
    public string? Gstin { get; init; }
    public string? Pan { get; init; }
    public string? AddressLine1 { get; init; }
    public string? AddressLine2 { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Pincode { get; init; }
    public string? Phone { get; init; }
    [EmailAddress] public string? Email { get; init; }
    public bool IsActive { get; init; } = true;
}

public record ProductDto
{
    public Guid Id { get; init; }
    public Guid BusinessId { get; init; }
    [Required, MinLength(2), MaxLength(200)] public string Name { get; init; } = "";
    [MaxLength(500)] public string? Description { get; init; }
    [MaxLength(20)] public string? HsnSacCode { get; init; }
    [Required] public string Unit { get; init; } = "NOS";
    [Range(0, double.MaxValue)] public decimal UnitPrice { get; init; }
    [RegularExpression("^(0|5|12|18|28)$")] public string GstRate { get; init; } = "18";
    public bool IsService { get; init; }
    public bool IsActive { get; init; } = true;
}

public record InvoiceDto
{
    public Guid Id { get; init; }
    public Guid BusinessId { get; init; }
    public Guid CustomerId { get; init; }
    public string InvoiceNumber { get; init; } = "";
    public string InvoiceType { get; init; } = "tax_invoice";
    public DateOnly InvoiceDate { get; init; }
    public DateOnly? DueDate { get; init; }
    public string? PlaceOfSupply { get; init; }
    public bool IsInterState { get; init; }
    public decimal Subtotal { get; init; }
    public decimal CgstAmount { get; init; }
    public decimal SgstAmount { get; init; }
    public decimal IgstAmount { get; init; }
    public decimal TotalTax { get; init; }
    public decimal TotalAmount { get; init; }
    public decimal AmountPaid { get; init; }
    public string Status { get; init; } = "draft";
    public string? Notes { get; init; }
    public string? Terms { get; init; }
    public Guid? CreatedBy { get; init; }
    public string? CustomerName { get; init; } // joined
}

public record InvoiceItemDto
{
    public Guid Id { get; init; }
    public Guid InvoiceId { get; init; }
    public Guid? ProductId { get; init; }
    [Required] public string Description { get; init; } = "";
    public string? HsnSacCode { get; init; }
    public decimal Quantity { get; init; } = 1;
    public string Unit { get; init; } = "NOS";
    public decimal UnitPrice { get; init; }
    public decimal DiscountPercent { get; init; }
    public decimal TaxableAmount { get; init; }
    public string GstRate { get; init; } = "18";
    public decimal CgstAmount { get; init; }
    public decimal SgstAmount { get; init; }
    public decimal IgstAmount { get; init; }
    public decimal TotalAmount { get; init; }
}

public record PaymentDto
{
    public Guid Id { get; init; }
    public Guid InvoiceId { get; init; }
    [Range(0.01, double.MaxValue)] public decimal Amount { get; init; }
    public DateOnly PaymentDate { get; init; }
    public string? PaymentMethod { get; init; }
    public string? ReferenceNumber { get; init; }
    public string? Notes { get; init; }
    public Guid? CreatedBy { get; init; }
}

public record CreateInvoiceRequest
{
    [Required] public Guid CustomerId { get; init; }
    public string InvoiceType { get; init; } = "tax_invoice";
    public DateOnly InvoiceDate { get; init; }
    public DateOnly? DueDate { get; init; }
    public string? Notes { get; init; }
    public string? Terms { get; init; }
    [Required, MinLength(1)] public List<InvoiceItemDto> Items { get; init; } = new();
}

public record DashboardStatsDto
{
    public int TotalInvoices { get; init; }
    public int TotalCustomers { get; init; }
    public decimal TotalRevenue { get; init; }
    public decimal PendingAmount { get; init; }
    public int OverdueCount { get; init; }
    public List<InvoiceDto> RecentInvoices { get; init; } = new();
}

public record GstSummaryDto
{
    public decimal TotalCgst { get; init; }
    public decimal TotalSgst { get; init; }
    public decimal TotalIgst { get; init; }
    public decimal TotalTax { get; init; }
    public decimal TotalSales { get; init; }
}

public record LoginRequest
{
    [Required, EmailAddress] public string Email { get; init; } = "";
    [Required] public string Password { get; init; } = "";
}

public record RegisterRequest
{
    [Required, EmailAddress] public string Email { get; init; } = "";
    [Required, MinLength(6)] public string Password { get; init; } = "";
    public string? FullName { get; init; }
}
