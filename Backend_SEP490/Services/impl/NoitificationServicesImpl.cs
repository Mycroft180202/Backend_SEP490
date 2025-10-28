using AutoMapper;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class NoitificationServicesImpl : GenericServices,INoitificationServices
{
    public NoitificationServicesImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
    {
    }
    
}