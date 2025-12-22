using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace Backend_SEP490.Services.impl
{
    public class StoryTellingServiceImpl : GenericServices, IStoryTellingService
    {
        private readonly Cloudinary _cloudinary;
        public StoryTellingServiceImpl(IMapper mapper, IUnitOfWork unitOfWork, Cloudinary cloudinary) : base(mapper, unitOfWork)
        {
            _cloudinary = cloudinary;
        }

        public async Task<string> CreateStoryTellingAsync(string userId, RequestCreateStoryTelling request)
        {
            var user = await _context.Users.GetUserByIDWithDetailAsync(userId);
            if (user == null)
            {
                return "User not found!";
            }

            string url = "";

            if (request.Image != null)
            {
                using var stream = request.Image.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(request.Image.FileName, stream)
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                url = uploadResult.SecureUrl.ToString();
            }
            var st = await _context.StoryTelling.GetAllStoryTellingByProductIdAsync(request.ProductId);

            StoryTelling newStoryTelling = new StoryTelling()
            {
                ProductId = request.ProductId,
                StoryType = Enum.Parse<StoryTellingType>(request.StoryType),
                Title = request.Title,
                Content = request.Content,
                Image = url,
                CreatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            return await _context.StoryTelling.CreateStoryTellingAsync(newStoryTelling);
        }

        public async Task<string> DeleteStoryTellingAsync(int storyTellingId)
        {
            var storyTellings = await _context.StoryTelling.GetStoryTellingByIdAsync(storyTellingId);
            if (storyTellings == null)
            {
                return "Not Found!";
            }

            var status = await _context.StoryTelling.DeleteStoryTellingAsync(storyTellings);
            return status;
        }

        public async Task<List<ResponseDTOStoryTelling>> GetAllStoryTellingByProductIdAsync(string productId)
        {
            var storyTellings = await _context.StoryTelling.GetAllStoryTellingByProductIdAsync(productId);
            var mappedList = _mapper.Map<IEnumerable<ResponseDTOStoryTelling>>(storyTellings).ToList();
            return mappedList;
        }

        public async Task<ResponseDTOStoryTelling> GetStoryTellingByIdAsync(int storyTellingId)
        {
            var storyTellings = await _context.StoryTelling.GetStoryTellingByIdAsync(storyTellingId);
            var mappedResult = _mapper.Map<ResponseDTOStoryTelling>(storyTellings);
            return mappedResult;
        }

        public async Task<string> UpdateStoryTellingAsync(int storyTellingId, RequestUpdateStoryTelling request)
        {
            var storyTellings = await _context.StoryTelling.GetStoryTellingByIdAsync(storyTellingId);
            if (storyTellings == null)
            {
                return "Not Found!";
            }
            string url = storyTellings.Image;

            if (request.Image != null)
            {
                using var stream = request.Image.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(request.Image.FileName, stream)
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                url = uploadResult.SecureUrl.ToString();
            }
            var status = await _context.StoryTelling.UpdateStoryTellingAsync(storyTellings, request, url);
            return status;
        }
    }
}
