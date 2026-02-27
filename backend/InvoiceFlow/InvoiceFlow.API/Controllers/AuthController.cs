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

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] LoginRequest request)
        {
            var exsits = await _context.AuthUsers.AnyAsync(u => u.Email == request.Email);

            if (exsits)
            {
                return BadRequest("User already exists");
            }

            var user = new AuthUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                EncryptedPassword = _authService.HashPassword(request.Password),

                UserRoles = new List<UserRole>{
                            new UserRole{Id = Guid.NewGuid(), Role = "Admin"}}
            };

            _context.AuthUsers.Add(user);
            await _context.SaveChangesAsync();

            var role = user.UserRoles?.FirstOrDefault()?.Role ?? "";
            var token = _authService.GenerateToken(user.Id.ToString(), role);
            return Ok(new LoginResponse { Token = token });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var user = await _context.AuthUsers
                .Include(x => x.UserRoles)
                .FirstOrDefaultAsync(x => x.Email == request.Email);

            if (user == null)
                return Unauthorized("Invalid credentials");

            bool validPassword = BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.EncryptedPassword
            );

            if (!validPassword)
                return Unauthorized("Invalid credentials");

            var role = user.UserRoles?.FirstOrDefault()?.Role ?? ""; // or handle missing role explicitly
            var token = _authService.GenerateToken(user.Id.ToString(), role);

            return Ok(new LoginResponse
            {
                Token = token
            });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            // 1️⃣ Get UserId from JWT
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
                return Unauthorized();

            // 2️⃣ Load user + roles
            var user = await _context.AuthUsers
                .Include(x => x.UserRoles)
                .Where(x => x.Id.ToString() == userId)
                .Select(x => new
                {
                    x.Id,
                    x.Email,
                    Roles = x.UserRoles.Select(r => r.Role),
                    Business = x.BusinessProfile
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound();

            // 3️⃣ Return safe user info
            return Ok(user);
        }
    }
}