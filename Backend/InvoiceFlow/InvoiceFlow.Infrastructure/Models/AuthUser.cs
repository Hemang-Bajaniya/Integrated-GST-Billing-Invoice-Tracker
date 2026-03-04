using System;
using System.Collections.Generic;

namespace InvoiceFlow.Infrastructure.Models;

public partial class AuthUser
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string? EncryptedPassword { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? EmailConfirmedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public Guid? BusinessProfileId { get; set; }

    public string? FullName { get; set; }

    public virtual BusinessProfile? BusinessProfile { get; set; }

    public virtual ICollection<Invitation> InvitationInvitedByNavigations { get; set; } = new List<Invitation>();

    public virtual ICollection<Invitation> InvitationInvitedUsers { get; set; } = new List<Invitation>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual Profile? Profile { get; set; }

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
