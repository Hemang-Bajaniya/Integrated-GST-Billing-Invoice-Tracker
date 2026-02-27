using System;
using System.Collections.Generic;

namespace InvoiceFlow.Infrastructure.Models;

public partial class Payment
{
    public Guid Id { get; set; }

    public Guid InvoiceId { get; set; }

    public decimal Amount { get; set; }

    public DateOnly PaymentDate { get; set; }

    public string? PaymentMethod { get; set; }

    public string? Status { get; set; }

    public string? ReferenceNumber { get; set; }

    public string? Notes { get; set; }

    public Guid? CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual AuthUser? CreatedByNavigation { get; set; }

    public virtual Invoice Invoice { get; set; } = null!;
}
