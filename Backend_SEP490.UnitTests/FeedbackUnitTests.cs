using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class FeedbackUnitTests
    {
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IFeedbackRepositories> _feedbackRepoMock;
        private readonly Mock<IUserRepositories> _userRepoMock;
        private readonly Mock<IProductRepositories> _productRepoMock;
        private readonly Mock<INotificationService> _notificationMock;

        private readonly FeedbackServicesImpl _service;

        public FeedbackUnitTests()
        {
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();

            _feedbackRepoMock = new Mock<IFeedbackRepositories>();
            _userRepoMock = new Mock<IUserRepositories>();
            _productRepoMock = new Mock<IProductRepositories>();

            _notificationMock = new Mock<INotificationService>();

            _unitOfWorkMock.Setup(u => u.Feedback).Returns(_feedbackRepoMock.Object);
            _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepoMock.Object);
            _unitOfWorkMock.Setup(u => u.Products).Returns(_productRepoMock.Object);

            _service = new FeedbackServicesImpl(
                _mapperMock.Object,
                _unitOfWorkMock.Object,
                _notificationMock.Object
            );
        }

        // --------------------------
        // CASE 1: GetFeedbacksByProductIdAsync
        // --------------------------

        [Fact(DisplayName = "GetFeedbacksByProductId - Normal Case - Returns mapped data")]
        public async Task GetFeedbacksByProductId_ReturnsMappedData()
        {
            // Arrange
            var productId = "PRO-001";

            var fakeEntities = new List<Feedback>
            {
                new Feedback { Id="FED-001", CustomerId="USER-1", Comment="Good" },
                new Feedback { Id="FED-002", CustomerId="USER-2", Comment="Bad" }
            };

            var fakeDtos = new List<ResponseDTOFeedback>
            {
                new ResponseDTOFeedback { Id="FED-001", CustomerId="USER-1" },
                new ResponseDTOFeedback { Id="FED-002", CustomerId="USER-2" }
            };

            _feedbackRepoMock.Setup(r => r.CountFeedbacksByProductIdAsync(productId))
                .ReturnsAsync(2);

            _feedbackRepoMock.Setup(r => r.GetFeedbacksByProductIdAsync(productId, 1, 10))
                .ReturnsAsync(fakeEntities);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOFeedback>>(fakeEntities))
                .Returns(fakeDtos);

            _userRepoMock.Setup(r => r.GetUserNameByIdAsync("USER-1")).ReturnsAsync("Alice");
            _userRepoMock.Setup(r => r.GetUserNameByIdAsync("USER-2")).ReturnsAsync("Bob");

            // Act
            var result = await _service.GetFeedbacksByProductIdAsync(productId, 1, 10);

            // Assert
            Assert.Equal(2, result.Items.Count());
            Assert.Equal("Alice", result.Items.First().CustomerName);
            Assert.Equal("Bob", result.Items.Last().CustomerName);
        }

        [Fact(DisplayName = "GetFeedbacksByProductId - Empty List - Returns empty list")]
        public async Task GetFeedbacksByProductId_EmptyList()
        {
            // Arrange
            _feedbackRepoMock.Setup(r => r.CountFeedbacksByProductIdAsync("P"))
                .ReturnsAsync(0);

            _feedbackRepoMock.Setup(r => r.GetFeedbacksByProductIdAsync("P", 1, 10))
                .ReturnsAsync(new List<Feedback>());

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOFeedback>>(It.IsAny<IEnumerable<Feedback>>()))
                .Returns(new List<ResponseDTOFeedback>());

            // Act
            var result = await _service.GetFeedbacksByProductIdAsync("P", 1, 10);

            // Assert
            Assert.Empty(result.Items);
        }

        [Fact(DisplayName = "GetFeedbacksByProductId - Null repository result - Returns empty list")]
        public async Task GetFeedbacksByProductId_NullRepositoryResult()
        {
            // Arrange
            _feedbackRepoMock.Setup(r => r.CountFeedbacksByProductIdAsync("P"))
                .ReturnsAsync(0);

            _feedbackRepoMock.Setup(r => r.GetFeedbacksByProductIdAsync("P", 1, 10))
                .ReturnsAsync((List<Feedback>)null);

            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOFeedback>>(null))
                .Returns(new List<ResponseDTOFeedback>());

            // Act
            var result = await _service.GetFeedbacksByProductIdAsync("P", 1, 10);

            // Assert
            Assert.Empty(result.Items);
        }

        // --------------------------
        // CASE 2: CreateFeedback
        // --------------------------

        [Fact(DisplayName = "CreateFeedback - Normal Case")]
        public async Task CreateFeedback_NormalCase_Throws()
        {
            var req = new RequestDTOFeedback { Comment = "Nice" };

            await Assert.ThrowsAsync<NullReferenceException>(() =>
                _service.CreateFeedback(req, "P001", "U001"));
        }


        [Fact(DisplayName = "CreateFeedback")]
        public async Task CreateFeedback_NullInput_Throws()
        {
            await Assert.ThrowsAsync<NullReferenceException>(() =>
                _service.CreateFeedback(null!, "P1", "U1"));
        }


        [Fact(DisplayName = "CreateFeedback - Empty productID ")]
        public async Task CreateFeedback_EmptyProductId_Throws()
        {
            var req = new RequestDTOFeedback { Comment = "Test" };

            await Assert.ThrowsAsync<NullReferenceException>(() =>
                _service.CreateFeedback(req, "", "U1"));
        }


        [Fact(DisplayName = "CreateFeedback - Empty userID ")]
        public async Task CreateFeedback_EmptyUserId_Throws()
        {
            var req = new RequestDTOFeedback { Comment = "Test" };

            await Assert.ThrowsAsync<NullReferenceException>(() =>
                _service.CreateFeedback(req, "P1", ""));
        }


        // --------------------------
        // CASE 3: UpdateFeedback
        // --------------------------

        [Fact(DisplayName = "UpdateFeedback - Normal Case")]
        public async Task UpdateFeedback_Normal()
        {
            var req = new RequestDTOFeedback { Comment = "Updated" };

            _feedbackRepoMock.Setup(r =>
                r.UpdateFeedbackByIdAsynnc(req, "P001", "F001"))
                .Returns(Task.CompletedTask);

            await _service.UpdateFeedbackByIdAsynnc(req, "P001", "F001");

            _feedbackRepoMock.Verify(r => r.UpdateFeedbackByIdAsynnc(req, "P001", "F001"), Times.Once);
        }

        [Fact(DisplayName = "UpdateFeedback - Null request does not throw")]
        public async Task UpdateFeedback_NullRequest_DoesNotThrow()
        {
            var ex = await Record.ExceptionAsync(() =>
                _service.UpdateFeedbackByIdAsynnc(null!, "P", "F"));
            Assert.Null(ex);
        }

        [Fact(DisplayName = "UpdateFeedback - Null request forwards to repository")]
        public async Task UpdateFeedback_NullRequest_ForwardsToRepository()
        {
            RequestDTOFeedback? req = null;

            _feedbackRepoMock.Setup(r => r.UpdateFeedbackByIdAsynnc(req, "P", "F"))
                .Returns(Task.CompletedTask);

            await _service.UpdateFeedbackByIdAsynnc(req, "P", "F");

            _feedbackRepoMock.Verify(r => r.UpdateFeedbackByIdAsynnc(null, "P", "F"), Times.Once);
        }

        [Fact(DisplayName = "UpdateFeedback - Null productID forwards to repository")]
        public async Task UpdateFeedback_NullProductId_ForwardsToRepository()
        {
            var req = new RequestDTOFeedback { Comment = "Updated" };

            _feedbackRepoMock.Setup(r => r.UpdateFeedbackByIdAsynnc(req, null!, "F1"))
                .Returns(Task.CompletedTask);

            await _service.UpdateFeedbackByIdAsynnc(req, null!, "F1");

            _feedbackRepoMock.Verify(r => r.UpdateFeedbackByIdAsynnc(req, null!, "F1"), Times.Once);
        }

        [Fact(DisplayName = "UpdateFeedback - Empty productID forwards to repository")]
        public async Task UpdateFeedback_EmptyProductId_ForwardsToRepository()
        {
            var req = new RequestDTOFeedback { Comment = "Updated" };

            _feedbackRepoMock.Setup(r => r.UpdateFeedbackByIdAsynnc(req, "", "F1"))
                .Returns(Task.CompletedTask);

            await _service.UpdateFeedbackByIdAsynnc(req, "", "F1");

            _feedbackRepoMock.Verify(r => r.UpdateFeedbackByIdAsynnc(req, "", "F1"), Times.Once);
        }

        [Fact(DisplayName = "UpdateFeedback - Null feedbackID forwards to repository")]
        public async Task UpdateFeedback_NullFeedbackId_ForwardsToRepository()
        {
            var req = new RequestDTOFeedback { Comment = "Updated" };

            _feedbackRepoMock.Setup(r => r.UpdateFeedbackByIdAsynnc(req, "P1", null!))
                .Returns(Task.CompletedTask);

            await _service.UpdateFeedbackByIdAsynnc(req, "P1", null!);

            _feedbackRepoMock.Verify(r => r.UpdateFeedbackByIdAsynnc(req, "P1", null!), Times.Once);
        }

        [Fact(DisplayName = "UpdateFeedback - Empty feedbackID forwards to repository")]
        public async Task UpdateFeedback_EmptyFeedbackId_ForwardsToRepository()
        {
            var req = new RequestDTOFeedback { Comment = "Updated" };

            _feedbackRepoMock.Setup(r => r.UpdateFeedbackByIdAsynnc(req, "P1", ""))
                .Returns(Task.CompletedTask);

            await _service.UpdateFeedbackByIdAsynnc(req, "P1", "");

            _feedbackRepoMock.Verify(r => r.UpdateFeedbackByIdAsynnc(req, "P1", ""), Times.Once);
        }

        [Fact(DisplayName = "UpdateFeedback - Repository throws exception is propagated")]
        public async Task UpdateFeedback_RepoThrows_ExceptionPropagates()
        {
            var req = new RequestDTOFeedback { Comment = "Updated" };
            var ex = new InvalidOperationException("repo fail");

            _feedbackRepoMock
                .Setup(r => r.UpdateFeedbackByIdAsynnc(req, "P1", "F1"))
                .ThrowsAsync(ex);

            var thrown = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.UpdateFeedbackByIdAsynnc(req, "P1", "F1")
            );

            Assert.Equal("repo fail", thrown.Message);
            _feedbackRepoMock.Verify(r => r.UpdateFeedbackByIdAsynnc(req, "P1", "F1"), Times.Once);
        }

        // --------------------------
        // CASE 4: DeleteFeedback
        // --------------------------

        [Fact(DisplayName = "DeleteFeedback - Normal Case")]
        public async Task DeleteFeedback_Normal()
        {
            _feedbackRepoMock.Setup(r => r.DeleteFeedbacksByIdAsync("FED-01"))
                .Returns(Task.CompletedTask);

            await _service.DeleteFeedbacksByIdAsync("FED-01");

            _feedbackRepoMock.Verify(r => r.DeleteFeedbacksByIdAsync("FED-01"), Times.Once);
        }

        [Fact(DisplayName = "DeleteFeedback - Null ID")]
        public async Task DeleteFeedback_NullId_Forwards()
        {
            _feedbackRepoMock.Setup(r => r.DeleteFeedbacksByIdAsync(null!))
                .Returns(Task.CompletedTask);

            await _service.DeleteFeedbacksByIdAsync(null!);

            _feedbackRepoMock.Verify(r => r.DeleteFeedbacksByIdAsync(null!), Times.Once);
        }

        [Fact(DisplayName = "DeleteFeedback - Empty ID")]
        public async Task DeleteFeedback_EmptyId_Forwards()
        {
            _feedbackRepoMock.Setup(r => r.DeleteFeedbacksByIdAsync(""))
                .Returns(Task.CompletedTask);

            await _service.DeleteFeedbacksByIdAsync("");

            _feedbackRepoMock.Verify(r => r.DeleteFeedbacksByIdAsync(""), Times.Once);
        }
    }
}
