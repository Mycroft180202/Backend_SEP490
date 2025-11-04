import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/modules/auth/authService';
import { FaUserCircle, FaPhoneAlt, FaHeart, FaHistory, FaLock, FaSignOutAlt, FaUserTie } from 'react-icons/fa';

function ProfileSection() {

		const [profile, setProfile] = useState(null);
		const [loading, setLoading] = useState(true);
		const [error, setError] = useState(null);

		useEffect(() => {
			const fetchUser = async () => {
				try {
					setLoading(true);
					const data = await AuthService.getUserInfo();
									setProfile({
										name: data.displayName || data.fullName || '',
										phone: data.phoneNumber || '',
										email: data.email || '',
										username: data.username || '',
										dob: data.dob || '',
										userUrlImage: data.userUrlImage || null,
										addresses: Array.isArray(data.addresses) ? data.addresses : [],
									});
					setLoading(false);
				} catch (err) {
					setError('Không thể lấy thông tin người dùng');
					setLoading(false);
				}
			};
			fetchUser();
		}, []);

		if (loading) return <div className="p-8 text-center">Đang tải thông tin...</div>;
		if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
		if (!profile) return null;

		return (
			<div className="bg-[#fdfde9] min-h-screen flex">
				{/* Sidebar */}
						<aside className="w-1/4 px-8 py-12 flex flex-col items-center border-r border-[#e5e5e5]">
							<img
								src={profile.userUrlImage ? profile.userUrlImage : '/images/default-avatar.png'}
								alt="User Avatar"
								className="w-28 h-28 rounded-full object-cover mb-4 border"
							/>
							<div className="font-bold text-lg mb-2">{profile.name}</div>
					<nav className="w-full mt-6">
						<ul className="space-y-4">
							<li className="flex items-center gap-2 text-[#9e211f] font-semibold">
								<FaUserCircle /> Thông tin tài khoản
							</li>
							<li className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]">
								<FaHistory /> Lịch sử mua hàng
							</li>
							<li className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]">
								<FaHeart /> Sản phẩm đã thích
							</li>
							<li className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]">
								<FaLock /> Đổi mật khẩu
							</li>
							<li className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]">
								<FaUserTie /> Đăng ký người bán hàng
							</li>
							<li className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-[#9e211f]">
								<FaSignOutAlt /> Đăng xuất
							</li>
						</ul>
					</nav>
				</aside>

				{/* Main content */}
				<main className="flex-1 px-16 py-12">
					<h2 className="text-[#9e211f] text-3xl font-bold mb-8">Thông tin tài khoản</h2>
				<form className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-2xl">
					<div className="col-span-2">
						<label className="block mb-2 font-medium">Địa chỉ</label>
						{profile.addresses && profile.addresses.length > 0 ? (
							<ul className="space-y-2">
								{profile.addresses.map((addr, idx) => (
									<li key={idx} className="border rounded px-4 py-2 bg-white flex items-center justify-between">
										<span>{addr.detail || addr.address || addr}</span>
										{/* Có thể thêm nút sửa/xóa địa chỉ ở đây */}
									</li>
								))}
							</ul>
						) : (
							<div className="text-gray-500">Chưa có địa chỉ nào</div>
						)}
					</div>
						<div>
							<label className="block mb-2 font-medium">Tên</label>
							<input type="text" value={profile.name} className="w-full border rounded px-4 py-2" readOnly />
						</div>
						<div>
							<label className="block mb-2 font-medium">Số điện thoại</label>
							<div className="flex items-center border rounded px-4 py-2 bg-white">
								<FaPhoneAlt className="mr-2 text-gray-400" />
								<span>{profile.phone}</span>
							</div>
						</div>
						<div>
							<label className="block mb-2 font-medium">Email</label>
							<div className="flex items-center border rounded px-4 py-2 bg-white">
								<FaUserCircle className="mr-2 text-gray-400" />
								<span>{profile.email}</span>
							</div>
						</div>
						<div>
							<label className="block mb-2 font-medium">Tên đăng nhập</label>
							<input type="text" value={profile.username} className="w-full border rounded px-4 py-2" readOnly />
						</div>
									<div>
										<label className="block mb-2 font-medium">Sinh nhật</label>
										<input
											type="text"
											value={profile.dob ? new Date(profile.dob).toLocaleDateString('vi-VN') : ''}
											className="w-full border rounded px-4 py-2"
											readOnly
										/>
									</div>
					</form>
					<button className="mt-8 px-8 py-2 bg-[#9e211f] text-white rounded font-semibold">Sửa thông tin</button>
				</main>
			</div>
		);
}

export default ProfileSection;