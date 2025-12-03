import React, { useState, useCallback, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import { ArtisanApplicationService } from "../../services/modules/artisan/artisanApplicationService";

const buildDateString = (day, month, year) => {
  if (!day || !month || !year) return "";
  const paddedDay = String(day).padStart(2, "0");
  const paddedMonth = String(month).padStart(2, "0");
  return `${year}-${paddedMonth}-${paddedDay}T00:00`;
};

function ArtisanRegistrationForm({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    identityNumber: "",
    identityFrontImageFile: null,
    identityBackImageFile: null,
    skillDescription: "",
    yearsOfExperience: 0,
    workshopAddress: "",
    shopName: "",
    bio: "",
  });

  const [fileNames, setFileNames] = useState({
    identityFrontImageFile: "No file chosen",
    identityBackImageFile: "No file chosen",
  });

  const [previewUrls, setPreviewUrls] = useState({
    identityFrontImageFile: "",
    identityBackImageFile: "",
  });

  useEffect(() => () => {
    Object.values(previewUrls).forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
  }, [previewUrls]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleFileChange = useCallback((e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setPreviewUrls((prev) => {
        const nextUrl = URL.createObjectURL(files[0]);
        if (prev[name]) {
          URL.revokeObjectURL(prev[name]);
        }
        return {
          ...prev,
          [name]: nextUrl,
        };
      });
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
      setFileNames((prev) => ({
        ...prev,
        [name]: files[0].name,
      }));
    }
  }, []);

  const validateForm = () => {
    const requiredFields = [
      { key: "fullName", label: "họ và tên" },
      { key: "email", label: "email" },
      { key: "phoneNumber", label: "số điện thoại" },
      { key: "identityNumber", label: "CMND/CCCD" },
      { key: "identityFrontImageFile", label: "ảnh mặt trước CMND/CCCD" },
      { key: "identityBackImageFile", label: "ảnh mặt sau CMND/CCCD" },
      { key: "skillDescription", label: "mô tả kỹ năng" },
      { key: "workshopAddress", label: "địa chỉ xưởng/cửa hàng" },
    ];

    for (const field of requiredFields) {
      const value = formData[field.key];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        toast.warning(`Vui lòng cung cấp ${field.label}`);
        return false;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.warning("Email không hợp lệ");
      return false;
    }

    // Validate phone format
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ""))) {
      toast.warning("Số điện thoại không hợp lệ");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const result = await ArtisanApplicationService.submitApplication(formData);
      toast.success("Đơn đăng ký được gửi thành công");
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
        dobDay: "",
        dobMonth: "",
        dobYear: "",
        identityNumber: "",
        identityFrontImageFile: null,
        identityBackImageFile: null,
        skillDescription: "",
        yearsOfExperience: 0,
        workshopAddress: "",
        shopName: "",
        bio: "",
      });
      setFileNames({
        identityFrontImageFile: "No file chosen",
        identityBackImageFile: "No file chosen",
      });
      setPreviewUrls((prev) => {
        Object.values(prev).forEach((url) => {
          if (url) {
            URL.revokeObjectURL(url);
          }
        });
        return {
          identityFrontImageFile: "",
          identityBackImageFile: "",
        };
      });

      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (error) {
      console.error("Error submitting application:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Không thể gửi đơn đăng ký. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <h2 className="text-[#9e211f] text-3xl font-bold mb-8">Đăng ký làm người bán hàng</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-2xl">
        {/* Full Name */}
        <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                placeholder="Nhập họ và tên"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                placeholder="user@example.com"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                placeholder="0912345678"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-1">
                Ngày sinh
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  name="dobDay"
                  value={formData.dobDay || ''}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    dobDay: e.target.value,
                    dateOfBirth: buildDateString(e.target.value, prev.dobMonth, prev.dobYear),
                  }))}
                  disabled={loading}
                  className="px-2 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                >
                  <option value="">Ngày</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={`day-${day}`} value={day}>{day}</option>
                  ))}
                </select>
                <select
                  name="dobMonth"
                  value={formData.dobMonth || ''}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    dobMonth: e.target.value,
                    dateOfBirth: buildDateString(prev.dobDay, e.target.value, prev.dobYear),
                  }))}
                  disabled={loading}
                  className="px-2 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                >
                  <option value="">Tháng</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={`month-${month}`} value={month}>{month}</option>
                  ))}
                </select>
                <select
                  name="dobYear"
                  value={formData.dobYear || ''}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    dobYear: e.target.value,
                    dateOfBirth: buildDateString(prev.dobDay, prev.dobMonth, e.target.value),
                  }))}
                  disabled={loading}
                  className="px-2 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                >
                  <option value="">Năm</option>
                  {Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={`year-${year}`} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Identity Number */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-1">
                CMND/CCCD <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="identityNumber"
                value={formData.identityNumber}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                placeholder="Nhập số CMND/CCCD"
              />
            </div>

            {/* Identity Front Image */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-2">
                Ảnh mặt trước CMND/CCCD <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  name="identityFrontImageFile"
                  onChange={handleFileChange}
                  disabled={loading}
                  accept="image/*"
                  className="hidden"
                  id="identity-front"
                />
                <label
                  htmlFor="identity-front"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg cursor-pointer hover:bg-gray-300 transition-colors font-nunito text-sm font-medium disabled:opacity-50"
                >
                  Chọn file
                </label>
                <span className="text-gray-600 font-nunito text-sm">
                  {fileNames.identityFrontImageFile}
                </span>
              </div>
              {previewUrls.identityFrontImageFile && (
                <div className="mt-3">
                  <img
                    src={previewUrls.identityFrontImageFile}
                    alt="Xem trước ảnh mặt trước CMND/CCCD"
                    className="h-28 w-auto rounded-md border border-gray-200 object-cover"
                  />
                </div>
              )}
            </div>

            {/* Identity Back Image */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-2">
                Ảnh mặt sau CMND/CCCD <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  name="identityBackImageFile"
                  onChange={handleFileChange}
                  disabled={loading}
                  accept="image/*"
                  className="hidden"
                  id="identity-back"
                />
                <label
                  htmlFor="identity-back"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg cursor-pointer hover:bg-gray-300 transition-colors font-nunito text-sm font-medium disabled:opacity-50"
                >
                  Chọn file
                </label>
                <span className="text-gray-600 font-nunito text-sm">
                  {fileNames.identityBackImageFile}
                </span>
              </div>
              {previewUrls.identityBackImageFile && (
                <div className="mt-3">
                  <img
                    src={previewUrls.identityBackImageFile}
                    alt="Xem trước ảnh mặt sau CMND/CCCD"
                    className="h-28 w-auto rounded-md border border-gray-200 object-cover"
                  />
                </div>
              )}
            </div>

            {/* Skill Description */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-1">
                Mô tả kỹ năng <span className="text-red-500">*</span>
              </label>
              <textarea
                name="skillDescription"
                value={formData.skillDescription}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                placeholder="Mô tả các kỹ năng của bạn"
                rows="3"
              />
            </div>

            {/* Years of Experience */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-1">
                Năm kinh nghiệm
              </label>
              <select
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
              >
                <option value="0">0 năm</option>
                {Array.from({ length: 40 }, (_, i) => i + 1).map((year) => (
                  <option key={`exp-${year}`} value={year}>{year} năm</option>
                ))}
              </select>
            </div>

            {/* Workshop Address */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-1">
                Địa chỉ xưởng/cửa hàng <span className="text-red-500">*</span>
              </label>
              <textarea
                name="workshopAddress"
                value={formData.workshopAddress}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                placeholder="Nhập địa chỉ xưởng/cửa hàng"
                rows="2"
              />
            </div>

            {/* Shop Name */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-1">
                Tên cửa hàng
              </label>
              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                placeholder="Nhập tên cửa hàng"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-1">
                Tiểu sử
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                placeholder="Nhập tiểu sử của bạn"
                rows="2"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary text-white rounded-lg font-nunito font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading && <FaSpinner className="animate-spin" />}
              {loading ? "Đang gửi..." : "Gửi đơn đăng ký"}
            </button>

            {/* Note */}
            <p className="text-xs text-gray-500 font-nunito text-center mt-4">
              <span className="text-red-500">*</span> Trường bắt buộc phải điền
            </p>
          </form>
    </>
  );
}

export default ArtisanRegistrationForm;
