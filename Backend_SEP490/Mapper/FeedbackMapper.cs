using AutoMapper;
using Backend_SEP490.Models;
using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Mapper
{
    public class FeedbackMapper: Profile
    {
        public FeedbackMapper()
        {
            CreateMap<Feedback, ResponeseDTOFeedback>().ReverseMap();
        }
    }
}

