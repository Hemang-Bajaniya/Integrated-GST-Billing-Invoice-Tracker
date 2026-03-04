using System;
using System.Collections.Generic;

namespace InvoiceFlow.Infrastructure.Models;

public partial class Invoice
{
    public Guid Id { get; set; }

    public Guid BusinessId { get; set; }

    public Guid CustomerId { get; set; }

    public string InvoiceNumber { get; set; } = null!;

    /// <summary>
    /// Type of invoice
    /// </summary>
    public string InvoiceType { get; set; } = null!;

    public DateOnly InvoiceDate { get; set; }

    public DateOnly? DueDate { get; set; }

    /// <summary>
    /// Indian states for GST
    /// </summary>
    public string? PlaceOfSupply { get; set; }

    public bool? IsInterState { get; set; }

    public decimal? Subtotal { get; set; }

    public decimal? CgstAmount { get; set; }

    public decimal? SgstAmount { get; set; }

    public decimal? IgstAmount { get; set; }

    public decimal? TotalTax { get; set; }

    public decimal? TotalAmount { get; set; }

    public decimal? AmountPaid { get; set; }

    /// <summary>
    /// Invoice status
    /// </summary>
    public string? Status { get; set; }

    public string? Notes { get; set; }

    public string? Terms { get; set; }

    public Guid? CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual BusinessProfile Business { get; set; } = null!;

    public virtual AuthUser? CreatedByNavigation { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
