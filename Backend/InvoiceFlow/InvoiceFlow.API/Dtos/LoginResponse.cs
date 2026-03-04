using System.ComponentModel.DataAnnotations;

namespace InvoiceFlow.API.Dtos
{
    public class LoginResponse
    {
        [Required]
        public string Token { get; set; } = default!;
    }
}
