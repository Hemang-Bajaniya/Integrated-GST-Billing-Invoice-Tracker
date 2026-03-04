using InvoiceFlow.API.Dtos;
using InvoiceFlow.API.Services;
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
    public class AuthController : ControllerBase
    {
        private readonly GstInvoiceTrackerDbContext _context;
        private readonly AuthService _authService;

        public AuthController(GstInvoiceTrackerDbContext context, AuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        // POST /api/auth/register  — company owner self-signup, always Admin + Active
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] LoginRequest request)
        {
            var exists = await _context.AuthUsers.AnyAsync(u => u.Email == request.Email);
            if (exists)
                return BadRequest("User already exists");

            var user = new AuthUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                EncryptedPassword = _authService.HashPassword(request.Password),
                Status = "Active",
                UserRoles = new List<UserRole>
                {
                    new UserRole { Id = Guid.NewGuid(), Role = "Admin" }
                }
            };

            _context.AuthUsers.Add(user);
            await _context.SaveChangesAsync();
            return Ok("User registered successfully");
        }

        // POST /api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var user = await _context.AuthUsers
                .Include(x => x.UserRoles)
                .FirstOrDefaultAsync(x => x.Email == request.Email);

            if (user == null)
                return Unauthorized("Invalid credentials");

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.EncryptedPassword))
                return Unauthorized("Invalid credentials");

            // ── Status gate ──────────────────────────────────────────────────
            if (user.Status == "PendingApproval")
                return Unauthorized("Your account is pending approval by your company admin.");
            if (user.Status == "Rejected")
                return Unauthorized("Your account request was not approved. Contact your company admin.");
            // ────────────────────────────────────────────────────────────────

            var role = user.UserRoles?.FirstOrDefault()?.Role ?? "";
            var token = _authService.GenerateToken(user.Id.ToString(), role);
            return Ok(new LoginResponse { Token = token });
        }

        // GET /api/auth/me
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var user = await _context.AuthUsers
                .Include(x => x.UserRoles)
                .Where(x => x.Id.ToString() == userId)
                .Select(x => new
                {
                    x.Id,
                    x.Email,
                    x.Status,
                    Roles = x.UserRoles.Select(r => r.Role),
                    Business = x.BusinessProfile
                })
                .FirstOrDefaultAsync();

            if (user == null) return NotFound();
            return Ok(user);
        }
    }
}