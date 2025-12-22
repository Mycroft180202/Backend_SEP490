using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper;

public class ArtisanApplicationMapper : Profile
{
    public ArtisanApplicationMapper()
    {
        CreateMap<ArtisanApplication, ResponseArtisanApplicationDto>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.ReviewerName,
                opt => opt.MapFrom(src => src.Reviewer != null
                    ? src.Reviewer.DisplayName ?? src.Reviewer.Username
                    : null));
    }
}
