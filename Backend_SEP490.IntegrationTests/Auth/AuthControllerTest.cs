using System.Net;
using System.Net.Http.Json;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Backend_SEP490.IntegrationTests.Auth;

// Integration tests for AuthController covering login/refresh/logout/register/verify-otp/forgot/reset flows
public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly AppDbContext _db;

    public AuthControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
        var scope = factory.Services.CreateScope();
        _db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    }

    // -------------------
    // Helpers
    // -------------------
    private async Task CleanupUserAsync(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user != null)
        {
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }
        var otps = _db.UserOtps.Where(o => o.Email == email);
        _db.UserOtps.RemoveRange(otps);
        await _db.SaveChangesAsync();
        var tokens = _db.RefreshTokens.Where(r => r.User.Email == email);
        _db.RefreshTokens.RemoveRange(tokens);
        await _db.SaveChangesAsync();
    }

    private static string NewUserId() => $"u{Guid.NewGuid():N}";

    private (RequestDTORegister form, string password) BuildRegisterForm(string? email = null, string? username = null)
    {
        var pwd = "Aa1@abcd"; // meets policy
        return (
            new RequestDTORegister
            {
                Username = username ?? $"user_{Guid.NewGuid().ToString("N")[..8]}",
                PasswordHash = pwd,
                Email = email ?? $"{Guid.NewGuid().ToString("N")[..8]}@example.com",
                PhoneNumber = "0123456789",
                DisplayName = "Integration Tester",
                Dob = null
            },
            pwd
        );
    }

    private static FormUrlEncodedContent ToForm(RequestDTORegister r)
    {
        var dict = new Dictionary<string, string?>
        {
            [nameof(RequestDTORegister.Username)] = r.Username,
            [nameof(RequestDTORegister.PasswordHash)] = r.PasswordHash,
            [nameof(RequestDTORegister.Email)] = r.Email,
            [nameof(RequestDTORegister.PhoneNumber)] = r.PhoneNumber,
            [nameof(RequestDTORegister.DisplayName)] = r.DisplayName,
            [nameof(RequestDTORegister.Dob)] = r.Dob?.ToString("O")
        }!;
        return new FormUrlEncodedContent(dict!);
    }

    private async Task CreateVerifiedUserAsync(string email, string username, string password)
    {
        // 1) register (form)
        var (reg, _) = BuildRegisterForm(email, username);
        reg.PasswordHash = password;
        var regRes = await _client.PostAsync("/register", ToForm(reg));
        regRes.StatusCode.Should().Be(HttpStatusCode.OK);

        // 2) fetch OTP from DB then verify
        var otp = await _db.UserOtps
            .Where(x => x.Email == email && !x.IsUsed)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();
        otp.Should().NotBeNull();

        var verifyReq = new RequestDTOVerifyOtp { RegisterDto = reg, Otp = otp!.OtpCode };
        var verifyRes = await _client.PostAsJsonAsync("/verify-otp", verifyReq);
        verifyRes.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private sealed class AuthTokens
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpireAt { get; set; }
    }

    private async Task<AuthTokens> LoginAsync(string username, string password)
    {
        var res = await _client.PostAsJsonAsync("/login", new { Username = username, Password = password });
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var tokens = await res.Content.ReadFromJsonAsync<AuthTokens>();
        tokens.Should().NotBeNull();
        tokens!.AccessToken.Should().NotBeNullOrWhiteSpace();
        tokens.RefreshToken.Should().NotBeNullOrWhiteSpace();
        return tokens!;
    }

    // ======================
    // POST /api/Auth/login
    // ======================

    [Fact]
    public async Task POST_Login_Đúng_thông_tin__200_kèm_token()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            var tokens = await LoginAsync(username, password);
            tokens.AccessToken.Should().NotBeNullOrWhiteSpace();
            tokens.RefreshToken.Should().NotBeNullOrWhiteSpace();
        }
        finally { await CleanupUserAsync(email); }
    }

    [Fact]
    public async Task POST_Login_Sai_mật_khẩu__401()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            var res = await _client.PostAsJsonAsync("/login", new { Username = username, Password = "Wrong123!" });
            res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
        finally { await CleanupUserAsync(email); }
    }

    [Fact(Skip = "Chưa hỗ trợ khóa tài khoản trong LoginAsync; bật test này khi service trả 403 cho IsActive=false")]
    public async Task POST_Login_Tài_khoản_bị_khóa__403()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            var user = await _db.Users.FirstAsync(u => u.Email == email);
            user.IsActive = false;
            await _db.SaveChangesAsync();

            var res = await _client.PostAsJsonAsync("/login", new { Username = username, Password = password });
            res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }
        finally { await CleanupUserAsync(email); }
    }

    [Fact]
    public async Task POST_Login_Thiếu_trường_bắt_buộc__400()
    {
        var res = await _client.PostAsJsonAsync("/login", new { Username = "someone" /* thiếu Password */});
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ======================
    // POST /api/Auth/refresh
    // ======================

    [Fact]
    public async Task POST_Refresh_Refresh_token_hợp_lệ__200()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            var tokens = await LoginAsync(username, password);

            var res = await _client.PostAsJsonAsync("/refresh", new RequestDTORefresh { RefreshToken = tokens.RefreshToken });
            res.StatusCode.Should().Be(HttpStatusCode.OK);
            var refreshed = await res.Content.ReadFromJsonAsync<AuthTokens>();
            refreshed!.AccessToken.Should().NotBeNullOrWhiteSpace();
        }
        finally { await CleanupUserAsync(email); }
    }

    [Fact]
    public async Task POST_Refresh_Hết_hạn_hoặc_không_khớp__401()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            var tokens = await LoginAsync(username, password);

            // set refresh token vừa tạo thành hết hạn để IsActive=false
            var tokenEntity = await _db.RefreshTokens.FirstAsync(r => r.Token == tokens.RefreshToken);
            tokenEntity.Expires = DateTime.UtcNow.AddMinutes(-1);
            await _db.SaveChangesAsync();

            var res = await _client.PostAsJsonAsync("/refresh", new RequestDTORefresh { RefreshToken = tokens.RefreshToken });
            res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
        finally { await CleanupUserAsync(email); }
    }

    [Fact]
    public async Task POST_Refresh_Thiếu_refresh_token__400()
    {
        var res = await _client.PostAsJsonAsync("/refresh", new { /* thiếu RefreshToken */ });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ======================
    // POST /api/Auth/logout
    // ======================

    [Fact]
    public async Task POST_Logout_Hợp_lệ__200()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            var tokens = await LoginAsync(username, password);

            var res = await _client.PostAsJsonAsync("/logout", new RequestDTORefresh { RefreshToken = tokens.RefreshToken });
            res.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally { await CleanupUserAsync(email); }
    }

    [Fact]
    public async Task POST_Logout_Refresh_token_không_tồn_tại__400()
    {
        var res = await _client.PostAsJsonAsync("/logout", new RequestDTORefresh { RefreshToken = Guid.NewGuid().ToString("N") });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ======================
    // POST /api/Auth/register
    // ======================

    [Fact]
    public async Task POST_Register_Đăng_ký_tài_khoản_mới__200()
    {
        var (reg, _) = BuildRegisterForm();
        try
        {
            var res = await _client.PostAsync("/register", ToForm(reg));
            res.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally { await CleanupUserAsync(reg.Email); }
    }

    [Fact]
    public async Task POST_Register_Email_trùng__400()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            // đăng ký lại với cùng email
            var (reg2, _) = BuildRegisterForm(email: email, username: $"{username}_2");
            var res = await _client.PostAsync("/register", ToForm(reg2));
            res.StatusCode.Should().Be(HttpStatusCode.BadRequest); // service trả BadRequest khi trùng
        }
        finally { await CleanupUserAsync(email); }
    }

    [Fact]
    public async Task POST_Register_Thiếu_hoặc_invalid_dữ_liệu__400()
    {
        var invalid = new Dictionary<string, string?>
        {
            ["Username"] = "ab", // < 3
            ["PasswordHash"] = "weak", // < 8 & thiếu pattern
            ["Email"] = "not-an-email"
        }!;
        var res = await _client.PostAsync("/register", new FormUrlEncodedContent(invalid!));
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ======================
    // POST /api/Auth/verify-otp
    // ======================

    [Fact]
    public async Task POST_VerifyOtp_OTP_đúng__200()
    {
        var (reg, _) = BuildRegisterForm();
        try
        {
            var regRes = await _client.PostAsync("/register", ToForm(reg));
            regRes.StatusCode.Should().Be(HttpStatusCode.OK);

            var otp = await _db.UserOtps.Where(o => o.Email == reg.Email && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();
            otp.Should().NotBeNull();

            var verify = new RequestDTOVerifyOtp { RegisterDto = reg, Otp = otp!.OtpCode };
            var verifyRes = await _client.PostAsJsonAsync("/verify-otp", verify);
            verifyRes.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally { await CleanupUserAsync(reg.Email); }
    }

    [Fact]
    public async Task POST_VerifyOtp_OTP_sai_hoặc_hết_hạn__400()
    {
        var (reg, _) = BuildRegisterForm();
        try
        {
            var regRes = await _client.PostAsync("/register", ToForm(reg));
            regRes.StatusCode.Should().Be(HttpStatusCode.OK);

            var verify = new RequestDTOVerifyOtp { RegisterDto = reg, Otp = "000000" };
            var res = await _client.PostAsJsonAsync("/verify-otp", verify);
            res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
        finally { await CleanupUserAsync(reg.Email); }
    }

    // ======================
    // POST /api/Auth/forgot-password
    // ======================

    [Fact]
    public async Task POST_ForgotPassword_Email_tồn_tại__200()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            var res = await _client.PostAsJsonAsync("/forgot-password", email);
            res.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally { await CleanupUserAsync(email); }
    }

    [Fact]
    public async Task POST_ForgotPassword_Email_không_tồn_tại__400()
    {
        var res = await _client.PostAsJsonAsync("/forgot-password", "ghost@example.com");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest); // controller hiện trả 400 khi không tồn tại
    }

    // ======================
    // POST /api/Auth/reset-password
    // ======================

    [Fact]
    public async Task POST_ResetPassword_Token_hợp_lệ__200()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            // yêu cầu OTP quên mật khẩu
            var forgotRes = await _client.PostAsJsonAsync("/forgot-password", email);
            forgotRes.StatusCode.Should().Be(HttpStatusCode.OK);

            var latestOtp = await _db.UserOtps.Where(o => o.Email == email && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();
            latestOtp.Should().NotBeNull();

            var dto = new RequestDTOResetPassword
            {
                Email = email,
                OtpCode = latestOtp!.OtpCode,
                NewPassword = "Bb2@bcde"
            };
            var res = await _client.PostAsJsonAsync("/reset-password", dto);
            res.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally { await CleanupUserAsync(email); }
    }

    [Fact]
    public async Task POST_ResetPassword_Token_sai_hoặc_hết_hạn__400()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            var dto = new RequestDTOResetPassword
            {
                Email = email,
                OtpCode = "111111", // sai
                NewPassword = "Bb2@bcde"
            };
            var res = await _client.PostAsJsonAsync("/reset-password", dto);
            res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
        finally { await CleanupUserAsync(email); }
    }

    [Fact]
    public async Task POST_ResetPassword_Mật_khẩu_không_đạt_policy__400()
    {
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..6]}";
        var password = "Aa1@abcd";
        try
        {
            await CreateVerifiedUserAsync(email, username, password);
            var _ = await _client.PostAsJsonAsync("/forgot-password", email);
            var latestOtp = await _db.UserOtps.Where(o => o.Email == email && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();
            latestOtp.Should().NotBeNull();

            var bad = new RequestDTOResetPassword
            {
                Email = email,
                OtpCode = latestOtp!.OtpCode,
                NewPassword = "short" // < 8, thiếu pattern
            };
            var res = await _client.PostAsJsonAsync("/reset-password", bad);
            res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
        finally { await CleanupUserAsync(email); }
    }
}
