import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';


export const AuthService = {
	/**
	 * Đăng nhập
	 * @param {LoginRequest} data
	 * @returns {Promise<LoginResponse>}
	 */
	async login(data) {
			const formData = new FormData();
			formData.append('Username', data.Username);
			formData.append('Password', data.Password);
			
			const res = await axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			return res.data;
		},
    
    /**
     * Đăng ký
     * @param {RegisterRequest} data
     * @returns {Promise<RegisterResponse>}
     */
    async register(data) {
        const formData = new FormData();
        formData.append('Email', data.Email);
        formData.append('Username', data.Username);
        formData.append('PasswordHash', data.PasswordHash);
        formData.append('PhoneNumber', data.PhoneNumber || '');
        formData.append('DisplayName', data.DisplayName || '');
        if (data.Dob) {
            formData.append('Dob', new Date(data.Dob).toISOString());
        }

        const res = await axiosClient.post(API_ENDPOINTS.AUTH.REGISTER, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return res;
    },

    /**
     * Xác thực OTP
     * @param {VerifyOtpRequest} data
     * @returns {Promise<VerifyOTPResponse>}
     */
    async verifyOTP(data) {
        const payload = {
            registerDto: {
                username: data.registerDto.username,
                passwordHash: data.registerDto.passwordHash,
                email: data.registerDto.email,
                phoneNumber: data.registerDto.phoneNumber,
                displayName: data.registerDto.displayName,
                dob: data.registerDto.dob
            },
            otp: data.otp
        };

        const res = await axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return res;
    },

        /**
     * Lấy thông tin người dùng
     * @returns {Promise<UserInfo>}
     */
    async getUserInfo() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('Token không tồn tại');
        }

        const res = await axiosClient.get(API_ENDPOINTS.USERS.USERS_PROFILE);
        return res.data;
    },

    /**
     * Gửi OTP đến email
     * @param {string} email
     * @returns {Promise<{ message: string }>}
     */
    async sendOtp(email) {
    const res = await axiosClient.post(API_ENDPOINTS.PASSWORD.FORGOT_PASSWORD, JSON.stringify(email), {
        headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*'
        }
    });
    return res.data;
},

    /**
     * Đặt lại mật khẩu
     * @param {ResetPasswordRequest} data
     * @returns {Promise<{ message: string }>} 
     */
    async resetPassword(data) {
        const payload = {
            email: data.email,
            otpCode: data.otpCode,
            newPassword: data.newPassword
        };

        const res = await axiosClient.post(API_ENDPOINTS.PASSWORD.RESET_PASSWORD, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        });
        return res.data;
    },
}