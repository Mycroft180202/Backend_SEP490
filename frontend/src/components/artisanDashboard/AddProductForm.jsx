import React, { useState } from 'react';
import { FaTimes, FaCloudUploadAlt, FaTrash } from 'react-icons/fa';

const AddProductForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  artisanId = '',
  categories = [],
}) => {
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    longDescription: '',
    price: '',
    category: '',
    artisanId: artisanId || '',
    stock: 0,
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [previewImages, setPreviewImages] = useState([]);

  // Sync initial data when editing
  React.useEffect(() => {
    if (!isOpen) return;
    setFormData((prev) => ({
      ...prev,
      ...initialData,
      artisanId: artisanId || initialData?.artisanId || prev.artisanId,
      images: [],
    }));
    setPreviewImages([]);
    setErrors({});
  }, [initialData, isOpen, artisanId]);

  // Validate field
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value || value.trim() === '') {
          newErrors.name = 'Tên sản phẩm không được để trống';
        } else if (value.length < 3 || value.length > 100) {
          newErrors.name = 'Tên sản phẩm phải từ 3–100 ký tự';
        } else {
          delete newErrors.name;
        }
        break;

      case 'shortDescription':
        if (value && value.length > 200) {
          newErrors.shortDescription = 'Mô tả ngắn không được vượt quá 200 ký tự';
        } else {
          delete newErrors.shortDescription;
        }
        break;

      case 'longDescription':
        if (value && value.length > 2000) {
          newErrors.longDescription = 'Mô tả chi tiết không được vượt quá 2000 ký tự';
        } else {
          delete newErrors.longDescription;
        }
        break;

      case 'price':
        if (!value || value === '') {
          newErrors.price = 'Giá sản phẩm không được để trống';
        } else if (parseFloat(value) < 0.01 || parseFloat(value) > 100000000) {
          newErrors.price = 'Giá sản phẩm phải lớn hơn 0';
        } else {
          delete newErrors.price;
        }
        break;

      case 'category':
        if (!value || value.trim() === '') {
          newErrors.category = 'Danh mục không được để trống';
        } else if (value.length > 50) {
          newErrors.category = 'Tên danh mục không được vượt quá 50 ký tự';
        } else {
          delete newErrors.category;
        }
        break;

      case 'artisanId':
        if (!value || value.trim() === '') {
          newErrors.artisanId = 'Mã nghệ nhân không được để trống';
        } else if (value.length > 50) {
          newErrors.artisanId = 'Mã nghệ nhân không được vượt quá 50 ký tự';
        } else {
          delete newErrors.artisanId;
        }
        break;

      case 'stock':
        if (value < 0) {
          newErrors.stock = 'Số lượng tồn kho không hợp lệ';
        } else {
          delete newErrors.stock;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        images: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'
      }));
      return;
    }

    // Validate file size (max 5MB per file)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        images: 'Mỗi file ảnh không được vượt quá 5MB'
      }));
      return;
    }

    // Add new files to existing ones
    const newFiles = [...formData.images, ...files];
    setFormData(prev => ({
      ...prev,
      images: newFiles
    }));

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviews]);

    // Clear image errors if at least one image is uploaded
    if (newFiles.length > 0) {
      setErrors(prev => {
        const { images, ...rest } = prev;
        return rest;
      });
    }
  };

  // Remove image
  const handleRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    setPreviewImages(newPreviews);

    // Set error if no images left
    if (newImages.length === 0) {
      setErrors(prev => ({
        ...prev,
        images: 'Phải có ít nhất 1 ảnh sản phẩm'
      }));
    }
  };

  // Validate all fields
  const validateAll = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Tên sản phẩm không được để trống';
    } else if (formData.name.length < 3 || formData.name.length > 100) {
      newErrors.name = 'Tên sản phẩm phải từ 3–100 ký tự';
    }

    if (formData.shortDescription && formData.shortDescription.length > 200) {
      newErrors.shortDescription = 'Mô tả ngắn không được vượt quá 200 ký tự';
    }

    if (formData.longDescription && formData.longDescription.length > 2000) {
      newErrors.longDescription = 'Mô tả chi tiết không được vượt quá 2000 ký tự';
    }

    if (!formData.price || formData.price === '') {
      newErrors.price = 'Giá sản phẩm không được để trống';
    } else if (parseFloat(formData.price) < 0.01 || parseFloat(formData.price) > 100000000) {
      newErrors.price = 'Giá sản phẩm phải lớn hơn 0';
    }

    if (!formData.category || formData.category.trim() === '') {
      newErrors.category = 'Danh mục không được để trống';
    } else if (formData.category.length > 50) {
      newErrors.category = 'Tên danh mục không được vượt quá 50 ký tự';
    }

    if (!formData.artisanId || formData.artisanId.trim() === '') {
      newErrors.artisanId = 'Mã nghệ nhân không được để trống';
    } else if (formData.artisanId.length > 50) {
      newErrors.artisanId = 'Mã nghệ nhân không được vượt quá 50 ký tự';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Số lượng tồn kho không hợp lệ';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'Phải có ít nhất 1 ảnh sản phẩm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateAll()) {
      return;
    }

    // Create FormData object for API submission
    const submitData = new FormData();
    const effectiveArtisanId = artisanId || formData.artisanId;
    submitData.append('Name', formData.name);
    submitData.append('ShortDescription', formData.shortDescription || '');
    submitData.append('LongDescription', formData.longDescription || '');
    submitData.append('Price', parseFloat(formData.price));
    submitData.append('Category', formData.category);
    submitData.append('ArtisanId', effectiveArtisanId);
    submitData.append('Stock', parseInt(formData.stock));
    
    // Append all images
    formData.images.forEach((image, index) => {
      submitData.append('Images', image);
    });

    // Call the onSubmit callback
    onSubmit(submitData);
    
    // Reset form
    handleReset();
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      name: '',
      shortDescription: '',
      longDescription: '',
      price: '',
      category: '',
      artisanId: artisanId || '',
      stock: 0,
      images: []
    });
    setErrors({});
    setPreviewImages([]);
  };

  // Handle close
  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 font-alata">Thêm sản phẩm mới</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin cơ bản</h3>
            
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập tên sản phẩm (3-100 ký tự)"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Category and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id || cat.categoryId} value={cat.id || cat.categoryId}>
                      {cat.name || cat.categoryName || cat.id}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá sản phẩm (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập giá sản phẩm"
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
            </div>

            {/* Artisan ID and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã nghệ nhân <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="artisanId"
                  value={formData.artisanId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.artisanId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mã nghệ nhân"
                />
                {errors.artisanId && <p className="text-red-500 text-xs mt-1">{errors.artisanId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng tồn kho
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.stock ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập số lượng tồn kho"
                />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả ngắn
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                maxLength="200"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.shortDescription ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Mô tả ngắn về sản phẩm (tối đa 200 ký tự)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.shortDescription.length}/200 ký tự
              </p>
              {errors.shortDescription && <p className="text-red-500 text-xs mt-1">{errors.shortDescription}</p>}
            </div>

            {/* Long Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                name="longDescription"
                value={formData.longDescription}
                onChange={handleChange}
                maxLength="2000"
                rows="5"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.longDescription ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Mô tả chi tiết về sản phẩm (tối đa 2000 ký tự)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.longDescription.length}/2000 ký tự
              </p>
              {errors.longDescription && <p className="text-red-500 text-xs mt-1">{errors.longDescription}</p>}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Hình ảnh sản phẩm <span className="text-red-500">*</span>
            </h3>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="images"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <FaCloudUploadAlt size={48} className="text-gray-400 mb-3" />
                <p className="text-gray-600 mb-1">
                  Kéo thả ảnh vào đây hoặc <span className="text-primary font-semibold">chọn file</span>
                </p>
                <p className="text-xs text-gray-500">
                  Hỗ trợ: JPG, PNG, GIF, WebP (Tối đa 5MB mỗi file)
                </p>
              </label>
            </div>
            {errors.images && <p className="text-red-500 text-xs">{errors.images}</p>}

            {/* Image Previews */}
            {previewImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewImages.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <FaTrash size={12} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Ảnh {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đặt lại
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Thêm sản phẩm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
