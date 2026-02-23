using System;
using System.Collections.Generic;

namespace InvoiceFlow.API.InvoiceFlow.Infrastructure.Models;

public partial class InvoiceItemTaxis
{
    public Guid Id { get; set; }

    public Guid? InvoiceItemId { get; set; }

    public string? TaxType { get; set; }

    public decimal? TaxRate { get; set; }

    public decimal? TaxAmount { get; set; }

    public virtual InvoiceItem? InvoiceItem { get; set; }
}
