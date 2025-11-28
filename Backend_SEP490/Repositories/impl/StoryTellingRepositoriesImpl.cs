using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;
using QRCoder.Extensions;

namespace Backend_SEP490.Repositories.impl
{
    public class StoryTellingRepositoriesImpl : GenericRepositoryImpl<StoryTelling>, IStoryTellingRepositories
    {
        public StoryTellingRepositoriesImpl(AppDbContext context) : base(context)
        {
            
        }

        public async Task<string> CreateStoryTellingAsync(StoryTelling storyTelling)
        {

            try
            {
                _context.StoryTellings.Add(storyTelling);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return $"Create {storyTelling.StoryType.ToString()} of the product is failed!";
            }
            return $"Create {storyTelling.StoryType.ToString()} of the product is successfully!";
        }

        public async Task<string> DeleteStoryTellingAsync(StoryTelling storyTelling)
        {
            try
            {
                _context.StoryTellings.Remove(storyTelling);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return $"Delete {storyTelling.StoryType.ToString()} of the product is failed!";
            }
            return $"Delete {storyTelling.StoryType.ToString()} of the product is successfully!";
        }

        public async Task<List<StoryTelling>> GetAllStoryTellingByProductIdAsync(string productId)
        {
            return await _context.StoryTellings.Where(st => st.ProductId.Equals(productId)).ToListAsync();
        }

        public async Task<StoryTelling> GetStoryTellingByIdAsync(int storyTellingId)
        {
            return await _context.StoryTellings.Where(st => st.Id == storyTellingId).FirstOrDefaultAsync();
        }

        public async Task<string> UpdateStoryTellingAsync(StoryTelling storyTelling, RequestUpdateStoryTelling request, string ImageURL)
        {
            try
            {
                storyTelling.StoryType = Enum.Parse<StoryTellingType>(request.StoryType);
                storyTelling.Title = request.Title;
                storyTelling.Content = request.Content;
                storyTelling.Image = ImageURL;
            }
            catch(Exception ex)
            {
                return $"Update data of {storyTelling.StoryType.ToString()} of the product is failed!";
            }

            try
            {
                _context.StoryTellings.Update(storyTelling);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return $"Update {storyTelling.StoryType.ToString()} of the product is failed!";
            }
            return $"Update {storyTelling.StoryType.ToString()} of the product is successfully!";
        }
    }
}
