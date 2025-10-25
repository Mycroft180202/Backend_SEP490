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
    }
};
