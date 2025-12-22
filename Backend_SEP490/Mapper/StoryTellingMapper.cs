using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper
{
    public class StoryTellingMapper: Profile
    {
        public StoryTellingMapper()
        {
            CreateMap<StoryTelling, ResponseDTOStoryTelling>()
                    .ForMember(dest => dest.StoryType, opt => opt.MapFrom(src => src.StoryType.ToString()));
        }
    }
}
