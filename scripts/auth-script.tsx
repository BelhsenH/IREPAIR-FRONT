import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/index';
const API_BASE_URL = config.apiUrl;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
interface RegisterData {
  type?: 'garagiste';
  nomGarage: string;
  adresse: string;
  zoneGeo: string;
  geolocation: {
    lat: number;
    lng: number;
  };
  nomResponsable: string;
  phoneNumber: string;
  email: string;
  typeService: string[];
  password: string;
}
interface LoginData {
  phoneNumber: string;
  password: string;
}
interface LoginResponse {
    token:string;
    user:{
        serviceHistory: string[],
        _id:string;
        type:'garagiste';
        nomGarage:string;
        adresse:string;
        zoneGeo:string;
        nomResponsable:string;
        phoneNumber:string;
        email:string;
        typeService:string[];
        password:string;
        verified:boolean;
        createdAt:string;
        updatedAt:string;
        
    };
}

interface VerifyPhoneData {
  phoneNumber: string;
  code:string;
}

interface ForgotPasswordData{
    phoneNumber:string;
}

interface ResetPasswordData {
    phoneNumber: string;
    code: string;
    newPassword:string;
}
interface ChangePasswordData{
    currentPassword: string;
    newPassword: string;
}

interface UpdateProfileData{
        nomGarage?:string;
        adresse?:string;
        zoneGeo?:string;
        nomResponsable?:string;
        email?:string;
        typeService?:string[];
        password?:string;
}

class AuthService{
    private async makeRequest<T>(
        endpoint: string,
        options:RequestInit={},
        timeout: number = 10000
    ): Promise<ApiResponse<T>> {
        try{
            const token = await AsyncStorage.getItem('@auth_token');
            const config:RequestInit={
                headers:{
                    'Content-Type':'application/json',
                    ...(token&&{Authorization:`Bearer ${token}`}),
                    ...options.headers,
                },
                ...options,
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            if (!response.ok) {
                let errorMessage = 'An error occurred';
                
                if (response.status === 401) {
                    errorMessage = 'Invalid credentials';
                } else if (response.status === 404) {
                    errorMessage = 'User not found';
                } else if (response.status === 403) {
                    errorMessage = 'Account not verified';
                } else if (response.status >= 500) {
                    errorMessage = 'Server error. Please try again later.';
                }
                
                return{
                    success:false,
                    error: data.message || errorMessage,
                };
            }
            return{
                success:true,
                data,
                message: data.message,
            };
        } catch(error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Request timeout. Please check your connection and try again.',
                };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error. Please check your connection.',
            };
        }
    }
    async register(userData: RegisterData):Promise<ApiResponse> {
        return this.makeRequest('/api/auth/irepair/register',{
            method: 'POST',
            body:JSON.stringify(userData)
        });
    }
    async verifyPhone(data:VerifyPhoneData):Promise<ApiResponse>{
        return this.makeRequest('/api/auth/irepair/verify',{
            method:'POST',
            body:JSON.stringify(data),
        });
    }
    async login(credentials:LoginData):Promise<ApiResponse<LoginResponse>>{
        const response = await this.makeRequest<LoginResponse>('/api/auth/irepair/login',{
            method:'POST',
            body:JSON.stringify(credentials),
        });
        if (response.success && response.data?.token){
            await AsyncStorage.setItem('@auth_token', response.data.token);

        }
        return response;
    }
    async forgotPassword(data:ForgotPasswordData):Promise<ApiResponse>{
        return this.makeRequest('/api/auth/irepair/forgot-password',{
            method:'POST',
            body:JSON.stringify(data),
        });
    }
    async resetPassword(data:ResetPasswordData):Promise<ApiResponse>{
        return this.makeRequest('/api/auth/irepair/reset-password',{
            method:'POST',
            body:JSON.stringify(data),
        });
    }
    async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
        return this.makeRequest('/api/auth/change-password', {
            method:'PUT',
            body:JSON.stringify(data),
    });
    }
    async getProfile():Promise<ApiResponse>{
        return this.makeRequest('/api/auth/me',{
            method:'GET',
        });
    }
    async updateProfile(data:UpdateProfileData):Promise<ApiResponse>{
        return this.makeRequest('/api/auth/profile',{
            method:'PUT',
            body:JSON.stringify(data),
        });
    }
    async resendVerificationCode(phoneNumber:string):Promise<ApiResponse>{
        return this.makeRequest('/api/auth/irepair/resend-code',{
            method:'POST',
            body:JSON.stringify({phoneNumber}),
        });
    }
    async logout():Promise<ApiResponse>{
        await AsyncStorage.removeItem('@auth_token');
        return this.makeRequest('/api/auth/irepair/logout',{
            method:'POST',
        });
    }
    async isAuthenticated():Promise<boolean>{
        const token = await AsyncStorage.getItem('@auth_token');
        return !!token
    }

    
}

export const authService = new AuthService();
export type {RegisterData, LoginData, VerifyPhoneData, ForgotPasswordData, ResetPasswordData, ChangePasswordData, UpdateProfileData};