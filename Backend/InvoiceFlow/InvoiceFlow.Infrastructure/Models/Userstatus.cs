using System;
using System.Collections.Generic;

namespace InvoiceFlow.Infrastructure.Models;

public partial class Userstatus
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<AuthUser> AuthUsers { get; set; } = new List<AuthUser>();
}
