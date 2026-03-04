using System;
using System.Collections.Generic;

namespace InvoiceFlow.Infrastructure.Models;

public partial class Invitation
{
    public Guid Id { get; set; }

    public Guid Token { get; set; }

    public Guid BusinessProfileId { get; set; }

    public Guid InvitedBy { get; set; }

    public string AssignedRole { get; set; } = null!;

    public string Status { get; set; } = null!;

    public Guid? InvitedUserId { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime  CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public virtual BusinessProfile BusinessProfile { get; set; } = null!;

    public virtual AuthUser InvitedByNavigation { get; set; } = null!;

    public virtual AuthUser? InvitedUser { get; set; }
}
