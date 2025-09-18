using AutoMapper;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services;

public class GenericServices
{
    protected readonly IMapper _mapper;
    protected readonly IUnitOfWork _context;

    public GenericServices(IMapper mapper, IUnitOfWork context)
    {
        _mapper = mapper;
        _context = context;
    }
}