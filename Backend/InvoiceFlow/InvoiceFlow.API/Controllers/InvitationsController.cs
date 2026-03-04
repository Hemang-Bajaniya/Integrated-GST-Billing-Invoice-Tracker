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
public class InvitationsController : ControllerBase
{
    private readonly GstInvoiceTrackerDbContext _db;
    public InvitationsController(GstInvoiceTrackerDbContext db) => _db = db;

    // ── helpers ───────────────────────────────────────────────────────────────
    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<Guid?> GetCurrentBusinessIdAsync()
    {
        var id = GetCurrentUserId();
        return await _db.AuthUsers
            .Where(u => u.Id == id)
            .Select(u => u.BusinessProfileId)
            .FirstOrDefaultAsync();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/invitations
    // Admin generates an invite link. Returns token for the URL.
    // Frontend builds: https://yourapp.com/register?token={token}
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(CreateInvitationResponse), 201)]
    public async Task<IActionResult> Create([FromBody] CreateInvitationRequest req)
    {
        var allowed = new[] { "Accountant", "Viewer" };
        if (!allowed.Contains(req.AssignedRole))
            return BadRequest("Role must be Accountant or Viewer.");

        var bizId = await GetCurrentBusinessIdAsync();
        if (bizId is null)
            return BadRequest("Your account is not linked to a business profile yet.");

        var inv = new Invitation
        {
            Token             = Guid.NewGuid(),
            BusinessProfileId = bizId.Value,
            InvitedBy         = GetCurrentUserId(),
            AssignedRole      = req.AssignedRole,
            ExpiresAt         = DateTime.UtcNow.AddDays(req.ExpiryDays > 0 ? req.ExpiryDays : 7),
        };

        _db.Invitations.Add(inv);
        await _db.SaveChangesAsync();

        var bizName = await _db.BusinessProfiles
            .Where(b => b.Id == bizId).Select(b => b.Name).FirstOrDefaultAsync() ?? "";

        return CreatedAtAction(nameof(Validate), new { token = inv.Token },
            new CreateInvitationResponse
            {
                Token        = inv.Token,
                AssignedRole = inv.AssignedRole,
                ExpiresAt    = inv.ExpiresAt,
                BusinessName = bizName,
            });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/invitations/validate/{token}   — PUBLIC, no auth
    // Register page calls this to show company name + role before the form.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("validate/{token:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(InvitationInfoResponse), 200)]
    public async Task<IActionResult> Validate(Guid token)
    {
        var inv = await _db.Invitations
            .Include(i => i.BusinessProfile)
            .FirstOrDefaultAsync(i => i.Token == token);

        if (inv is null)             return NotFound("Invitation not found.");
        if (inv.Status != "Pending") return BadRequest(
            inv.Status == "Accepted" ? "This link has already been used." : "This invitation is no longer valid.");
        if (inv.ExpiresAt < DateTime.UtcNow)
            return BadRequest("This invitation link has expired. Ask your admin for a new one.");

        return Ok(new InvitationInfoResponse
        {
            BusinessName = inv.BusinessProfile.Name,
            AssignedRole = inv.AssignedRole,
            ExpiresAt    = inv.ExpiresAt,
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/invitations/accept   — PUBLIC, no auth
    // User submits email + password → creates AuthUser with Status=PendingApproval
    // They cannot log in until admin approves.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPost("accept")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    public async Task<IActionResult> Accept([FromBody] AcceptInvitationRequest req)
    {
        var inv = await _db.Invitations
            .Include(i => i.BusinessProfile)
            .FirstOrDefaultAsync(i => i.Token == req.Token);

        if (inv is null)             return NotFound("Invitation not found.");
        if (inv.Status != "Pending") return BadRequest("This invitation has already been used.");
        if (inv.ExpiresAt < DateTime.UtcNow) return BadRequest("This invitation link has expired.");

        if (await _db.AuthUsers.AnyAsync(u => u.Email == req.Email))
            return BadRequest("An account with this email already exists.");

        var newUser = new AuthUser
        {
            Email             = req.Email,
            EncryptedPassword = BCrypt.Net.BCrypt.HashPassword(req.Password),
            BusinessProfileId = inv.BusinessProfileId,
            Status            = "PendingApproval",   // blocked until admin approves
        };

        _db.AuthUsers.Add(newUser);
        inv.Status        = "Accepted";
        inv.InvitedUserId = newUser.Id;
        inv.UpdatedAt     = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = $"Registration successful! Your access to " +
                      $"\"{inv.BusinessProfile.Name}\" is pending admin approval."
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/invitations/pending
    // Admin gets list of users who registered via invite and await approval.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("pending")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(List<PendingUserDto>), 200)]
    public async Task<IActionResult> GetPending()
    {
        var bizId = await GetCurrentBusinessIdAsync();
        if (bizId is null) return BadRequest("No business profile linked.");

        var list = await _db.Invitations
            .Include(i => i.InvitedUser)
            .Where(i =>
                i.BusinessProfileId == bizId &&
                i.Status == "Accepted" &&
                i.InvitedUser != null &&
                i.InvitedUser.Status == "PendingApproval")
            .OrderByDescending(i => i.InvitedUser!.CreatedAt)
            .Select(i => new PendingUserDto
            {
                InvitationId = i.Id,
                UserId       = i.InvitedUser!.Id,
                Email        = i.InvitedUser.Email,
                AssignedRole = i.AssignedRole,
                RegisteredAt = i.InvitedUser.CreatedAt,
            })
            .ToListAsync();

        return Ok(list);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/invitations/{id}/approve
    // Activates the user. Optional role override via request body.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPut("{id:guid}/approve")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveUserRequest? req = null)
    {
        var bizId = await GetCurrentBusinessIdAsync();
        var inv = await _db.Invitations
            .Include(i => i.InvitedUser).ThenInclude(u => u!.UserRoles)
            .FirstOrDefaultAsync(i => i.Id == id && i.BusinessProfileId == bizId);

        if (inv is null)                         return NotFound("Invitation not found.");
        if (inv.InvitedUser is null)             return BadRequest("No user registered yet.");
        if (inv.InvitedUser.Status != "PendingApproval")
            return BadRequest("This user has already been processed.");

        var allowed = new[] { "Accountant", "Viewer" };
        var role = req?.Role is not null && allowed.Contains(req.Role)
            ? req.Role : inv.AssignedRole;

        inv.InvitedUser.Status = "Active";
        inv.Status             = "Approved";
        inv.UpdatedAt          = DateTime.UtcNow;

        _db.UserRoles.RemoveRange(inv.InvitedUser.UserRoles);
        inv.InvitedUser.UserRoles.Add(new UserRole { Role = role });

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/invitations/{id}/reject
    // Deletes the pending user entirely, marks invitation Rejected.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPut("{id:guid}/reject")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Reject(Guid id)
    {
        var bizId = await GetCurrentBusinessIdAsync();
        var inv = await _db.Invitations
            .Include(i => i.InvitedUser).ThenInclude(u => u!.UserRoles)
            .FirstOrDefaultAsync(i => i.Id == id && i.BusinessProfileId == bizId);

        if (inv is null)             return NotFound("Invitation not found.");
        if (inv.InvitedUser is null) return BadRequest("No user registered yet.");
        if (inv.InvitedUser.Status != "PendingApproval")
            return BadRequest("This user has already been processed.");

        _db.AuthUsers.Remove(inv.InvitedUser);
        inv.InvitedUserId = null;
        inv.Status        = "Rejected";
        inv.UpdatedAt     = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/invitations
    // Admin lists all invite links for their business (history).
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(List<InvitationListDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var bizId = await GetCurrentBusinessIdAsync();
        if (bizId is null) return BadRequest("No business profile linked.");

        var list = await _db.Invitations
            .Include(i => i.InvitedUser)
            .Where(i => i.BusinessProfileId == bizId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvitationListDto
            {
                Id           = i.Id,
                Token        = i.Token,
                AssignedRole = i.AssignedRole,
                Status       = i.Status,
                InvitedEmail = i.InvitedUser != null ? i.InvitedUser.Email : null,
                ExpiresAt    = i.ExpiresAt,
                CreatedAt    = i.CreatedAt,
            })
            .ToListAsync();

        return Ok(list);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/invitations/{id}
    // Admin revokes an unused Pending link before it is claimed.
    // ─────────────────────────────────────────────────────────────────────────
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Revoke(Guid id)
    {
        var bizId = await GetCurrentBusinessIdAsync();
        var inv = await _db.Invitations
            .FirstOrDefaultAsync(i => i.Id == id && i.BusinessProfileId == bizId);

        if (inv is null)          return NotFound();
        if (inv.Status != "Pending") return BadRequest("Only unused (Pending) links can be revoked.");

        _db.Invitations.Remove(inv);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

public class CreateInvitationRequest
{
    [Required] public string AssignedRole { get; set; } = "Viewer";
    public int ExpiryDays { get; set; } = 7;
}
public class CreateInvitationResponse
{
    public Guid     Token        { get; set; }
    public string   AssignedRole { get; set; } = default!;
    public DateTime ExpiresAt    { get; set; }
    public string   BusinessName { get; set; } = default!;
}
public class InvitationInfoResponse
{
    public string   BusinessName { get; set; } = default!;
    public string   AssignedRole { get; set; } = default!;
    public DateTime ExpiresAt    { get; set; }
}
public class AcceptInvitationRequest
{
    [Required] public Guid   Token    { get; set; }
    [Required, EmailAddress] public string Email { get; set; } = default!;
    [Required, MinLength(6)] public string Password { get; set; } = default!;
}
public class PendingUserDto
{
    public Guid     InvitationId { get; set; }
    public Guid     UserId       { get; set; }
    public string   Email        { get; set; } = default!;
    public string   AssignedRole { get; set; } = default!;
    public DateTime RegisteredAt { get; set; }
}
public class ApproveUserRequest
{
    public string? Role { get; set; } // optional override
}
public class InvitationListDto
{
    public Guid     Id           { get; set; }
    public Guid     Token        { get; set; }
    public string   AssignedRole { get; set; } = default!;
    public string   Status       { get; set; } = default!;
    public string?  InvitedEmail { get; set; }
    public DateTime ExpiresAt    { get; set; }
    public DateTime CreatedAt    { get; set; }
}
