using InvoiceFlow.Infrastructure.Context;
using InvoiceFlow.Infrastructure.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace InvoiceFlow.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly GstInvoiceTrackerDbContext _db;

        public AdminUsersController(GstInvoiceTrackerDbContext db) => _db = db;

        // ── helpers ───────────────────────────────────────────────────────────
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

        private static readonly string[] AllowedRoles = { "Accountant", "Viewer" };

        // ── GET /api/adminusers ───────────────────────────────────────────────
        // Returns only users in the same business, excluding self.
        [HttpGet]
        [ProducesResponseType(typeof(List<UserDto>), 200)]
        public async Task<IActionResult> GetUsers()
        {
            var bizId = await GetCurrentBusinessIdAsync();
            var selfId = GetCurrentUserId();

            if (bizId is null)
                return BadRequest("Your account is not linked to a business profile yet.");

            var users = await _db.AuthUsers
                .Include(x => x.UserRoles)
                .Where(x =>
                    x.BusinessProfileId == bizId &&
                    x.Id != selfId)
                .Select(x => new UserDto
                {
                    Id = x.Id,
                    Email = x.Email,
                    Roles = x.UserRoles.Select(r => r.Role).ToList(),
                })
                .ToListAsync();

            return Ok(users);
        }

        // ── POST /api/adminusers ──────────────────────────────────────────────
        // Admin directly creates a user — immediately Active, no approval needed.
        [HttpPost]
        [ProducesResponseType(typeof(Guid), 200)]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (!request.Roles.All(r => AllowedRoles.Contains(r)))
                return BadRequest("Only Accountant or Viewer roles can be assigned.");

            var bizId = await GetCurrentBusinessIdAsync();
            if (bizId is null)
                return BadRequest("Your account is not linked to a business profile yet.");

            if (await _db.AuthUsers.AnyAsync(x => x.Email == request.Email))
                return BadRequest("Email already exists.");

            var user = new AuthUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                EncryptedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password),
                BusinessProfileId = bizId.Value,
                Status = "Active",          // direct-create bypasses approval
                CreatedAt = DateTime.UtcNow,
            };

            foreach (var role in request.Roles)
                user.UserRoles.Add(new UserRole { Id = Guid.NewGuid(), Role = role });

            _db.AuthUsers.Add(user);
            await _db.SaveChangesAsync();

            return Ok(user.Id);
        }

        // ── PUT /api/adminusers/roles ─────────────────────────────────────────
        // Update role of a user in the same business.
        [HttpPut("roles")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> UpdateRoles([FromBody] UpdateUserRolesRequest request)
        {
            if (!request.Roles.All(r => AllowedRoles.Contains(r)))
                return BadRequest("Only Accountant or Viewer roles can be assigned.");

            var bizId = await GetCurrentBusinessIdAsync();
            var selfId = GetCurrentUserId();

            if (request.UserId == selfId)
                return BadRequest("You cannot edit your own roles.");

            var user = await _db.AuthUsers
                .Include(x => x.UserRoles)
                .FirstOrDefaultAsync(x =>
                    x.Id == request.UserId &&
                    x.BusinessProfileId == bizId);

            if (user is null) return NotFound("User not found in your business.");

            if (user.UserRoles.Any(r => r.Role == "Admin"))
                return StatusCode(403, "Cannot modify another Admin's roles.");

            _db.UserRoles.RemoveRange(user.UserRoles);
            foreach (var role in request.Roles)
                user.UserRoles.Add(new UserRole { Id = Guid.NewGuid(), Role = role });

            await _db.SaveChangesAsync();
            return NoContent();
        }

        // ── DELETE /api/adminusers/{id} ───────────────────────────────────────
        // Permanently removes a user from the business.
        [HttpDelete("{id:guid}")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var bizId = await GetCurrentBusinessIdAsync();
            var selfId = GetCurrentUserId();

            if (id == selfId)
                return BadRequest("You cannot delete your own account.");

            var user = await _db.AuthUsers
                .Include(x => x.UserRoles)
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.BusinessProfileId == bizId);

            if (user is null) return NotFound("User not found in your business.");

            if (user.UserRoles.Any(r => r.Role == "Admin"))
                return StatusCode(403, "Cannot delete another Admin.");

            _db.AuthUsers.Remove(user);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = default!;
        public List<string> Roles { get; set; } = new();
    }

    public class CreateUserRequest
    {
        public string Email { get; set; } = default!;
        public string Password { get; set; } = default!;
        public List<string> Roles { get; set; } = new();
    }

    public class UpdateUserRolesRequest
    {
        public Guid UserId { get; set; }
        public List<string> Roles { get; set; } = new();
    }
}