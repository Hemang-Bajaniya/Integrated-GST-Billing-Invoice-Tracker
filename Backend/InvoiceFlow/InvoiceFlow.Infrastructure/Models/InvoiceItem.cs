using System;
using System.Collections.Generic;

namespace InvoiceFlow.Infrastructure.Models;

public partial class InvoiceItem
{
    public Guid Id { get; set; }

    public Guid InvoiceId { get; set; }

    public Guid? ProductId { get; set; }

    public string Description { get; set; } = null!;

    public string? HsnSacCode { get; set; }

    public decimal Quantity { get; set; }

    public string? Unit { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal? DiscountPercent { get; set; }

    public decimal? TaxableAmount { get; set; }

    public Guid GstRateId { get; set; }

    public decimal? CgstAmount { get; set; }

    public decimal? SgstAmount { get; set; }

    public decimal? IgstAmount { get; set; }

    public decimal? TotalAmount { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual GstRate GstRate { get; set; } = null!;

    public virtual Invoice Invoice { get; set; } = null!;

    public virtual ICollection<InvoiceItemTaxis> InvoiceItemTaxes { get; set; } = new List<InvoiceItemTaxis>();

    public virtual Product? Product { get; set; }
}
