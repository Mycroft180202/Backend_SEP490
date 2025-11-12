using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper;

public class NotificationMapper : Profile
{
    public NotificationMapper()
    {
        CreateMap<Notification, ResponseNotificationDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserID));
    }
}
