import React, { useState, useCallback } from "react";
import { FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import { ArtisanApplicationService } from "../../services/modules/artisan/artisanApplicationService";

function ArtisanRegistrationForm({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
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
      "fullName",
      "email",
      "phoneNumber",
      "identityNumber",
      "skillDescription",
      "workshopAddress",
    ];

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === "") {
        toast.warning(`Vui lòng điền ${field}`);
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
              <input
                type="datetime-local"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
              />
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
                Ảnh mặt trước CMND/CCCD
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
            </div>

            {/* Identity Back Image */}
            <div>
              <label className="block text-sm font-nunito font-semibold text-gray-700 mb-2">
                Ảnh mặt sau CMND/CCCD
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
              <input
                type="number"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                disabled={loading}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-nunito text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50"
                placeholder="0"
              />
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
