export interface RegisterRequest {
  Username: string;
  Password: string;
  Email: string;
  PhoneNumber: string;
  DisplayName: string;
  Dob: string;
}

export interface VerifyOtpRequest {
  registerDto: RegisterRequest;
  otp: string;
}

