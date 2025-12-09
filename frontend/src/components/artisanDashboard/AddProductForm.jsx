import React, { useState } from 'react';
import {
  FaTimes,
  FaCloudUploadAlt,
  FaTrash,
  FaSpinner,
} from 'react-icons/fa';
import { ProductService } from '../../services/modules/products/productService';

const normalizeInitialImages = (source) => {
  if (!source) return [];
  const rawList = source.images
    || source.Images
    || source.productImages
    || source.ProductImages
    || [];

  const derived = Array.isArray(rawList) ? rawList : [];

  const mapped = derived
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { id: null, url: item };
      }
      const url = item.url
        || item.imageUrl
        || item.ImageUrl
        || item.urlImage
        || item.path
        || item.src
        || item.thumbnail
        || null;
      if (!url) return null;
      const id = item.id
        || item.imageId
        || item.ImageId
        || item.productImageId
        || item.ProductImageId
        || null;
      return { id, url };
    })
    .filter((item) => item && item.url);

  if (mapped.length > 0) {
    return mapped;
  }

  if (source.imageUrl) {
    return [{ id: null, url: source.imageUrl }];
  }

  if (source.image) {
    return [{ id: null, url: source.image }];
  }

  return [];
};

const AddProductForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  artisanId = '',
  categories = [],
}) => {
  const isEditing = Boolean(initialData?.id);
  const buildInitialState = React.useCallback((rawSource = {}) => {
    const source = rawSource || {};
    return {
      name: source.name || source.Name || '',
      shortDescription: source.shortDescription || source.ShortDescription || '',
      longDescription: source.longDescription || source.LongDescription || '',
      price: source.price ?? source.Price ?? '',
      category: source.category || source.Category || '',
      artisanId: artisanId || source.artisanId || source.ArtisanId || '',
      stock: source.stock ?? source.Stock ?? 0,
      images: [],
    };
  }, [artisanId]);

  const [formData, setFormData] = useState(() => buildInitialState());
  const [errors, setErrors] = useState({});
  const [previewImages, setPreviewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Sync initial data when editing
  React.useEffect(() => {
    if (!isOpen) return;
    setFormData(buildInitialState(initialData));
    setExistingImages(normalizeInitialImages(initialData));
    setPreviewImages([]);
    setErrors({});
  }, [initialData, isOpen, artisanId, buildInitialState]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      if (!isOpen || !isEditing || !initialData?.id) return;
      try {
        setIsDetailLoading(true);
        const detailResponse = await ProductService.getProductById(initialData.id);
        if (!isMounted) return;
        const detail = detailResponse?.product || detailResponse;
        setFormData((prev) => ({
          ...prev,
          name: detail?.name || detail?.Name || prev.name,
          shortDescription: detail?.shortDescription || detail?.ShortDescription || prev.shortDescription,
          longDescription: detail?.longDescription || detail?.LongDescription || prev.longDescription,
          price: detail?.price ?? detail?.Price ?? prev.price,
          category: detail?.category || detail?.Category || prev.category,
          stock: detail?.stock ?? detail?.Stock ?? prev.stock,
        }));
        setExistingImages(normalizeInitialImages(detail));
      } catch (error) {
        console.error('Failed to load product detail:', error);
      } finally {
        if (isMounted) {
          setIsDetailLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isEditing, initialData?.id]);

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
    if (isSubmitting) return;
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };

  // Handle file upload
  const handleFileChange = (e) => {
    if (isSubmitting) return;
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
    if ((newFiles.length + existingImages.length) > 0) {
      setErrors(prev => {
        const { images, ...rest } = prev;
        return rest;
      });
    }
  };

  // Remove image
  const handleRemoveImage = (index) => {
    if (isSubmitting) return;
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    setPreviewImages(newPreviews);

    // Set error if no images left
    if ((newImages.length + existingImages.length) === 0) {
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

    if (formData.stock < 0) {
      newErrors.stock = 'Số lượng tồn kho không hợp lệ';
    }

    if ((formData.images.length + existingImages.length) === 0) {
      newErrors.images = 'Phải có ít nhất 1 ảnh sản phẩm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
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
    formData.images.forEach((image) => {
      submitData.append('Images', image);
    });

    if (existingImages.length > 0) {
      submitData.append('ExistingImages', JSON.stringify(existingImages));
    }

    setIsSubmitting(true);
    let shouldReset = false;
    try {
      const result = await onSubmit(submitData);
      if (result !== false) {
        shouldReset = true;
      }
    } catch (submitError) {
      console.error('Submit product error:', submitError);
    } finally {
      setIsSubmitting(false);
      if (shouldReset) {
        handleReset();
      }
    }
  };

  // Reset form
  const handleReset = () => {
    if (isEditing) {
      setFormData(buildInitialState(initialData));
      setExistingImages(normalizeInitialImages(initialData));
    } else {
      setFormData(buildInitialState());
      setExistingImages([]);
    }
    setErrors({});
    setPreviewImages([]);
  };

  // Handle close
  const handleClose = () => {
    if (isSubmitting) return;
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        {(isSubmitting || isDetailLoading) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm">
            <FaSpinner className="text-primary text-3xl animate-spin" />
          </div>
        )}
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 font-alata">
            {isEditing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
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

            {/* Stock */}
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
            {existingImages.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-2">Ảnh hiện tại</p>
                <div className="flex flex-wrap gap-3">
                  {existingImages.map((image) => (
                    <img
                      key={image.id || image.url}
                      src={image.url}
                      alt="product-current"
                      className="h-20 w-20 rounded-lg object-cover border"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="hidden"
              />
              <label
                htmlFor="images"
                className={`flex flex-col items-center justify-center ${isSubmitting ? 'cursor-not-allowed opacity-60 pointer-events-none' : 'cursor-pointer'}`}
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
                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
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
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              Đặt lại
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting && <FaSpinner className="animate-spin" />}
              {isSubmitting
                ? 'Đang lưu...'
                : isEditing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
