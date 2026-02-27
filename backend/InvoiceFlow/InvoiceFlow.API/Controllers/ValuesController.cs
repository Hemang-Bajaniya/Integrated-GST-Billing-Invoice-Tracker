//using InvoiceFlow.Infrastructure.Context;
//using InvoiceFlow.Infrastructure.Models;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using System.Security.Claims;
//using InvoiceFlow.API.Dtos; 

//namespace InvoiceFlow.API.Controllers
//{
//    [Authorize(Roles = "Admin")]
//    [ApiController]
//    [Route("api/business-profile")]
//    public class BusinessProfileController : ControllerBase
//    {
//        private readonly GstInvoiceTrackerDbContext _db;

//        public BusinessProfileController(GstInvoiceTrackerDbContext db)
//        {
//            _db = db;
//        }

//        [HttpGet]
//        public async Task<IActionResult> Get()
//        {
//            var userId = Guid.Parse(
//                User.FindFirstValue(ClaimTypes.NameIdentifier)!
//            );

//            var user = await _db.AuthUsers
//                .Include(u => u.BusinessProfile)
//                .FirstOrDefaultAsync(u => u.Id == userId);

//            if (user?.BusinessProfile == null)
//                return Ok(null);

//            return Ok(user.BusinessProfile);
//        }

//        [HttpPost]
//        public async Task<IActionResult> Create(BusinessProfileDto request)
//        {
//            var userId = Guid.Parse(
//                User.FindFirstValue(ClaimTypes.NameIdentifier)!
//            );

//            var user = await _db.AuthUsers
//                .FirstOrDefaultAsync(x => x.Id == userId);

//            if (user == null)
//                return Unauthorized();

//            if (user.BusinessProfileId != null)
//                return BadRequest("Business profile already exists");

//            var business = new BusinessProfile
//            {
//                Id = Guid.NewGuid(),
//                Name = request.Name,
//                Gstin = request.Gstin,
//                Pan = request.Pan,
//                AddressLine1 = request.AddressLine1,
//                AddressLine2 = request.AddressLine2,
//                City = request.City,
//                State = request.State,
//                Pincode = request.Pincode,
//                Phone = request.Phone,
//                Email = request.Email,
//                BankName = request.BankName,
//                BankAccountNumber = request.BankAccountNumber,
//                BankIfsc = request.BankIfsc,
//                InvoicePrefix = request.InvoicePrefix,
//                CreatedAt = DateTime.UtcNow
//            };

//            user.BusinessProfileId = business.Id;

//            _db.BusinessProfiles.Add(business);
//            await _db.SaveChangesAsync();

//            return Ok(business);
//        }

//        [HttpPut]
//        public async Task<IActionResult> Update(BusinessProfileDto request)
//        {
//            var userId = Guid.Parse(
//                User.FindFirstValue(ClaimTypes.NameIdentifier)!
//            );

//            var user = await _db.AuthUsers
//                .Include(u => u.BusinessProfile)
//                .FirstOrDefaultAsync(u => u.Id == userId);

//            if (user?.BusinessProfile == null)
//                return NotFound("Business profile not found");

//            var b = user.BusinessProfile;

//            b.Name = request.Name;
//            b.Gstin = request.Gstin;
//            b.Pan = request.Pan;
//            b.AddressLine1 = request.AddressLine1;
//            b.AddressLine2 = request.AddressLine2;
//            b.City = request.City;
//            b.State = request.State;
//            b.Pincode = request.Pincode;
//            b.Phone = request.Phone;
//            b.Email = request.Email;
//            b.BankName = request.BankName;
//            b.BankAccountNumber = request.BankAccountNumber;
//            b.BankIfsc = request.BankIfsc;
//            b.InvoicePrefix = request.InvoicePrefix;
//            b.UpdatedAt = DateTime.UtcNow;

//            await _db.SaveChangesAsync();

//            return Ok(b);
//        }


//    }
//}