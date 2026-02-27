using InvoiceFlow.Infrastructure.Context;
using InvoiceFlow.Infrastructure.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;

namespace InvoiceFlow.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly GstInvoiceTrackerDbContext _db;

        public AdminUsersController(GstInvoiceTrackerDbContext db)
        {
            _db = db;
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser(CreateUserRequest request)
        {
            var exists = await _db.AuthUsers
                .AnyAsync(x => x.Email == request.Email);

            if (exists)
                return BadRequest("Email already exists");

            var user = new AuthUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                EncryptedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password),
                CreatedAt = DateTime.UtcNow
            };

            // attach roles
            foreach (var role in request.Roles)
            {
                user.UserRoles.Add(new UserRole
                {
                    Id = Guid.NewGuid(),
                    Role = role
                });
            }

            _db.AuthUsers.Add(user);

            await _db.SaveChangesAsync();

            return Ok(user.Id);
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _db.AuthUsers
                .Include(x => x.UserRoles)
                .Select(x => new
                {
                    x.Id,
                    x.Email,
                    Roles = x.UserRoles.Select(r => r.Role)
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPut("roles")]
        public async Task<IActionResult> UpdateRoles(UpdateUserRolesRequest request)
        {
            var user = await _db.AuthUsers
                .Include(x => x.UserRoles)
                .FirstOrDefaultAsync(x => x.Id == request.UserId);

            if (user == null)
                return NotFound();

            // remove existing roles
            _db.UserRoles.RemoveRange(user.UserRoles);

            // add new roles
            foreach (var role in request.Roles)
            {
                user.UserRoles.Add(new UserRole
                {
                    Id = Guid.NewGuid(),
                    Role = role
                });
            }

            await _db.SaveChangesAsync();

            return Ok();
        }
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