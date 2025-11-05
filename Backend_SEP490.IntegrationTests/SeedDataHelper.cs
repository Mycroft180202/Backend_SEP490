//using Backend_SEP490.Models;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace Backend_SEP490.IntegrationTests
//{
//    public class SeedDataHelper
//    {
//        public static async Task SeedUserAndOtpAsync(CustomWebApplicationFactory<Program> factory, string email, string otp, bool isExpired, bool isUsed)
//        {
//            // Thường phần này bạn sẽ có `ApplicationDbContext` từ factory.Services
//            // Ví dụ nếu factory của bạn có CreateScope():
//            using var scope = factory.Services.CreateScope();
//            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

//            var user = new User
//            {
//                Id = Guid.NewGuid(),
//                Email = email,
//                PasswordHash = "OldPasswordHash",
//            };
//            await db.Users.AddAsync(user);

//            var otpEntity = new UserOtp
//            {
//                Id = Guid.NewGuid(),
//                Email = email,
//                OtpCode = otp,
//                IsUsed = isUsed,
//                ExpiresAt = isExpired ? DateTime.UtcNow.AddMinutes(-5) : DateTime.UtcNow.AddMinutes(10)
//            };
//            await db.UserOtps.AddAsync(otpEntity);

//            await db.SaveChangesAsync();
//        }
//    }
//}
