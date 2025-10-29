export interface UserRole {
  name: string;
  description: string;
}

export interface UserInfo {
  userID: string;
  username: string;
  email: string;
  isActive: boolean;
  updateAt: string;
  createAt: string;
  phoneNumber: string;
  displayName: string;
  dob: string;
  userUrlImage: string | null;
  addresses: any[];
  roles: UserRole[];
}