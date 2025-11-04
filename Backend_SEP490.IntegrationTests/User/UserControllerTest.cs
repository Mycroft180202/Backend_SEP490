using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using System.Net;
using System.Text;

namespace Backend_SEP490.IntegrationTests.User
{
    public class UserControllerTest : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly AppDbContext _db;

        public UserControllerTest(CustomWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            var scope = factory.Services.CreateScope();
            _db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        }

        //  GetAll -> GetDetail
        [Fact(DisplayName = "UserFlow: GetAll -> GetDetail")]
        public async Task UserFlow_GetAll_Then_GetDetail_ShouldReturnSameUser()
        {
            // Arrange: tạo filter trống
            var filter = new { FullName = "", Email = "" };
            var json = JsonConvert.SerializeObject(filter);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Step 1: GET ALL
            var getAllResponse = await _client.PostAsync("/users/1/10", content);
            getAllResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            var getAllBody = await getAllResponse.Content.ReadAsStringAsync();

            // Step 2: Lấy 1 userId thực tế từ DB
            var firstUser = _db.Users.FirstOrDefault();
            firstUser.Should().NotBeNull();

            // Step 3: Gọi API GET DETAIL
            var getDetailResponse = await _client.GetAsync($"/users/{firstUser!.UserID}");
            getDetailResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var detailBody = await getDetailResponse.Content.ReadAsStringAsync();
            detailBody.Should().Contain(firstUser.Email);
        }

        //  GetDetail -> Update -> GetDetail
        [Fact(DisplayName = "UserFlow: GetDetail -> Update -> GetDetail")]
        public async Task UserFlow_GetDetail_Update_GetDetail_ShouldReflectChange()
        {
            // Step 1: Lấy 1 user từ DB
            var user = _db.Users.FirstOrDefault();
            user.Should().NotBeNull();

            // Step 2: Gọi GET DETAIL
            var getResponse = await _client.GetAsync($"/users/{user!.UserID}");
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            // Step 3: UPDATE user
            var updatePayload = new
            {
                DisplayName = "Updated_Flow_User",
                PhoneNumber = "0988777666"
            };
            var updateJson = JsonConvert.SerializeObject(updatePayload);
            var updateContent = new StringContent(updateJson, Encoding.UTF8, "application/json");

            var putResponse = await _client.PutAsync($"/users/{user.UserID}", updateContent);
            putResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            // Step 4: Gọi GET DETAIL lại và verify
            var recheck = await _client.GetAsync($"/users/{user.UserID}");
            recheck.StatusCode.Should().Be(HttpStatusCode.OK);
            var recheckBody = await recheck.Content.ReadAsStringAsync();
            recheckBody.Should().Contain("Updated_Flow_User");
        }

        //  Profile Flow -> GetMe -> UpdateMe -> GetMe
        [Fact(DisplayName = "UserFlow: GetProfile -> UpdateProfile -> Verify")]
        public async Task UserFlow_GetProfile_UpdateProfile_Verify_ShouldPass()
        {
            // Step 1: GET PROFILE
            var profileResponse = await _client.GetAsync("/users/me");
            profileResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            // Step 2: UPDATE PROFILE
            var updatePayload = new
            {
                DisplayName = "IntegrationTester",
                PhoneNumber = "0123123123"
            };
            var content = new StringContent(JsonConvert.SerializeObject(updatePayload), Encoding.UTF8, "application/json");
            var updateResponse = await _client.PutAsync("/users/me", content);
            updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            // Step 3: GET PROFILE AGAIN
            var recheck = await _client.GetAsync("/users/me");
            recheck.StatusCode.Should().Be(HttpStatusCode.OK);
            var body = await recheck.Content.ReadAsStringAsync();
            body.Should().Contain("IntegrationTester");
        }

        //  Address Flow -> Create -> GetAll -> Update -> Delete
        [Fact(DisplayName = "UserFlow: Address CRUD Flow")]
        public async Task UserFlow_Address_CRUD_ShouldWork()
        {
            // Step 1: CREATE ADDRESS
            var createPayload = new RequestCreateAndUpdateAddress
            {
                Line1 = "123 Flow Street",
                Line2 = "Apt 4B",
                City = "Hanoi",
                PosttalCode = "111000",
                Country = "Vietnam",
                IsDefault = true
            };
            var createContent = new StringContent(JsonConvert.SerializeObject(createPayload), Encoding.UTF8, "application/json");
            var createResponse = await _client.PostAsync("/users/address", createContent);
            createResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            // Step 2: GET ALL ADDRESS
            var getAll = await _client.GetAsync("/users/address");
            getAll.StatusCode.Should().Be(HttpStatusCode.OK);
            var getAllBody = await getAll.Content.ReadAsStringAsync();
            getAllBody.Should().Contain("123 Flow Street");

            // Step 3: Lấy addressId thực tế từ DB
            var addr = _db.Addresses.FirstOrDefault(x => x.PosttalCode == createPayload.PosttalCode);
            addr.Should().NotBeNull();

            // Data raw : ADR-USER-20251022-095607-11/1/2025 8:56:49 AM
            var encodedId = Uri.EscapeDataString(addr.Id);
            //// Step 4: UPDATE
            var updatePayload = new RequestCreateAndUpdateAddress
            {
                Line1 = "Dong Da",
                Line2 = "Apt 4B",
                City = "Hanoi",
                PosttalCode = "111000",
                Country = "Vietnam",
                IsDefault = true
            };

            var updateContent = new StringContent(JsonConvert.SerializeObject(updatePayload), Encoding.UTF8, "application/json");
            var updateResponse = await _client.PutAsync($"/users/address/{encodedId}", updateContent);
            updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            // Step 5: DELETE
            var deleteResponse = await _client.DeleteAsync($"users/address/{encodedId}");
            deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
