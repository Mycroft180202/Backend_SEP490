import React from 'react';
import CustomBreadcrumbs from '../shared/CustomBreadcrumbs';
import RelationBlog from './RelationBlog';
import { FaCalendarAlt, FaUser, FaClock, FaFacebookF, FaTwitter, FaLinkedinIn, FaLink } from 'react-icons/fa';

const Detail = () => {
  // Sample data - replace with actual data from API/props
  const blogData = {
    id: 1,
    title: 'Khám phá nghệ thuật đan mây tre truyền thống tại làng Hòa Lạc',
    category: 'Làng nghề',
    author: 'Nguyễn Văn A',
    publishDate: '17-10-2025',
    readTime: '5 phút đọc',
    mainImage: 'https://images.unsplash.com/photo-1582721478779-0ae163c05a60?w=1200',
    content: [
      {
        type: 'paragraph',
        text: 'Làng nghề mây tre đan Hòa Lạc là một trong những làng nghề truyền thống lâu đời nhất ở miền Bắc Việt Nam. Với hơn 300 năm hình thành và phát triển, làng nghề đã tạo ra những sản phẩm mây tre đan tinh xảo, mang đậm bản sắc văn hóa dân tộc.'
      },
      {
        type: 'heading',
        text: 'Lịch sử hình thành'
      },
      {
        type: 'paragraph',
        text: 'Nghề đan mây tre ở Hòa Lạc được hình thành từ thế kỷ 18, khi những người dân địa phương bắt đầu khai thác nguồn nguyên liệu tre, mây dồi dào trong khu vực để tạo ra các sản phẩm phục vụ đời sống hàng ngày. Qua nhiều thế hệ, nghề đan mây tre đã trở thành nghề truyền thống, được truyền từ cha sang con, từ thầy đến trò.'
      },
      {
        type: 'image',
        src: 'https://images.unsplash.com/photo-1565191999001-551c187427bb?w=800',
        caption: 'Nghệ nhân đang đan một sản phẩm mây tre'
      },
      {
        type: 'heading',
        text: 'Quy trình sản xuất'
      },
      {
        type: 'paragraph',
        text: 'Quy trình tạo ra một sản phẩm mây tre đan trải qua nhiều công đoạn tỉ mỉ. Đầu tiên, nghệ nhân phải chọn lựa nguyên liệu tre, mây có chất lượng tốt, sau đó phơi khô và xử lý để tránh mối mọt. Tiếp theo là công đoạn tách sợi, nhuộm màu và cuối cùng là đan theo các kiểu mẫu truyền thống hoặc sáng tạo.'
      },
      {
        type: 'quote',
        text: 'Mỗi sản phẩm mây tre đan không chỉ là đồ dùng thông thường mà còn là tác phẩm nghệ thuật, mang trong mình tâm huyết và tài hoa của người nghệ nhân.'
      },
      {
        type: 'paragraph',
        text: 'Ngày nay, làng nghề Hòa Lạc không chỉ giữ gìn nghề truyền thống mà còn không ngừng đổi mới, sáng tạo để tạo ra những sản phẩm phù hợp với xu hướng hiện đại, đáp ứng nhu cầu thị trường trong và ngoài nước.'
      },
      {
        type: 'images-grid',
        images: [
          'https://images.unsplash.com/photo-1565191999001-551c187427bb?w=400',
          'https://images.unsplash.com/photo-1582721478779-0ae163c05a60?w=400'
        ]
      },
      {
        type: 'heading',
        text: 'Ý nghĩa văn hóa'
      },
      {
        type: 'paragraph',
        text: 'Nghề đan mây tre không chỉ mang giá trị kinh tế mà còn có ý nghĩa văn hóa sâu sắc. Nó thể hiện sự khéo léo, tính cẩn thận và lòng kiên nhẫn của người Việt. Các sản phẩm mây tre đan còn là cầu nối giữa quá khứ và hiện tại, giúp thế hệ trẻ hiểu hơn về nghề truyền thống của cha ông.'
      }
    ],
    tags: ['Làng nghề', 'Mây tre đan', 'Hòa Lạc', 'Thủ công', 'Văn hóa Việt']
  };

  const breadcrumbs = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: blogData.title }
  ];

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = blogData.title;
    
    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Đã sao chép link!');
        break;
      default:
        break;
    }
  };

  const renderContent = (item, index) => {
    switch(item.type) {
      case 'paragraph':
        return (
          <p key={index} className="text-gray-700 text-lg leading-relaxed mb-6">
            {item.text}
          </p>
        );
      case 'heading':
        return (
          <h2 key={index} className="font-alata text-2xl md:text-3xl text-[#8B4513] mt-8 mb-4">
            {item.text}
          </h2>
        );
      case 'image':
        return (
          <figure key={index} className="my-8">
            <img 
              src={item.src} 
              alt={item.caption}
              className="w-full rounded-lg shadow-md"
            />
            {item.caption && (
              <figcaption className="text-center text-gray-600 text-sm mt-3 italic">
                {item.caption}
              </figcaption>
            )}
          </figure>
        );
      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-[#8B4513] pl-6 py-4 my-8 bg-[#FFF8E7] rounded-r-lg">
            <p className="text-gray-800 text-lg italic font-medium">
              "{item.text}"
            </p>
          </blockquote>
        );
      case 'images-grid':
        return (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
            {item.images.map((img, idx) => (
              <img 
                key={idx}
                src={img} 
                alt={`Gallery ${idx + 1}`}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#FFFBF0] min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <CustomBreadcrumbs breadcrumbs={breadcrumbs} />
        </div>
      </div>

      {/* Hero Image */}
      <div className="w-full h-[400px] md:h-[500px] lg:h-[600px] relative overflow-hidden">
        <img 
          src={blogData.mainImage} 
          alt={blogData.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-block bg-[#8B4513] text-white px-4 py-1 rounded-full text-sm font-medium">
            {blogData.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-alata text-3xl md:text-4xl lg:text-5xl text-[#8B4513] mb-6 leading-tight">
          {blogData.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <FaUser className="text-[#8B4513]" />
            <span className="font-nunito">{blogData.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-[#8B4513]" />
            <span className="font-nunito">{blogData.publishDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaClock className="text-[#8B4513]" />
            <span className="font-nunito">{blogData.readTime}</span>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex items-center gap-4 mb-8">
          <span className="font-nunito text-gray-700 font-medium">Chia sẻ:</span>
          <div className="flex gap-3">
            <button 
              onClick={() => handleShare('facebook')}
              className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Share on Facebook"
            >
              <FaFacebookF />
            </button>
            <button 
              onClick={() => handleShare('twitter')}
              className="w-10 h-10 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Share on Twitter"
            >
              <FaTwitter />
            </button>
            <button 
              onClick={() => handleShare('linkedin')}
              className="w-10 h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Share on LinkedIn"
            >
              <FaLinkedinIn />
            </button>
            <button 
              onClick={() => handleShare('copy')}
              className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="Copy link"
            >
              <FaLink />
            </button>
          </div>
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none">
          {blogData.content.map((item, index) => renderContent(item, index))}
        </article>

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-nunito text-gray-700 font-medium">Tags:</span>
            {blogData.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-[#8B4513] hover:text-white hover:border-[#8B4513] transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Related Blogs */}
      <RelationBlog />
    </div>
  );
};

export default Detail;