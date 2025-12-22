using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Services;

public interface IContactService
{
    Task SubmitContactRequestAsync(ContactRequest request);
}
