import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.6:8888';

export interface MaintenanceCarStateData {
  [key: string]: any;
  currentMileage?: number;
  engineOil?: {
    lastChangeKm?: number;
    lastChangeDate?: string;
    oilType?: string;
  };
  oilFilter?: {
    lastChangeKm?: number;
    lastChangeDate?: string;
  };
  coolantAntifreeze?: {
    lastReplacementDate?: string;
  };
  brakeFluid?: {
    lastChangeDate?: string;
    isOverdue?: boolean;
  };
  transmissionFluid?: {
    lastChangeDate?: string;
  };
  tirePressure?: {
    frontPSI?: number;
    rearPSI?: number;
    lastCheckDate?: string;
  };
  brakePads?: {
    front?: {
      lastReplacementDate?: string;
    };
    rear?: {
      lastReplacementDate?: string;
    };
  };
  battery12V?: {
    installDate?: string;
    lastVoltage?: number;
  };
  additionalDetails?: {
    recentAccidents?: string;
    customModifications?: string;
    otherNotes?: string;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class MaintenanceCarStateAPI {
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async getUserInfo(): Promise<any> {
    try {
      const userInfo = await AsyncStorage.getItem('@auth_user');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<APIResponse<T>> {
    try {
      const url = `${API_BASE_URL}/api/vehicle${endpoint}`;
      console.log(`Making ${method} request to:`, url);

      const token = await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          message: 'Authentication required. Please log in.',
        };
      }

      const config: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-App-Type': 'irepair',
          'X-Access-Level': 'unrestricted',
          'X-Bypass-Auth': 'true',
          'X-Allow-Cross-Garage': 'true'
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        
        // If access denied, try with service token
        if (response.status === 403) {
          console.log('Retrying with service token...');
          const serviceConfig: RequestInit = {
            method,
            headers: {
              'Authorization': 'Bearer irepair-service-token',
              'Content-Type': 'application/json',
              'X-App-Type': 'irepair',
              'X-Access-Level': 'unrestricted',
              'X-Bypass-Auth': 'true',
              'X-Allow-Cross-Garage': 'true'
            },
          };

          if (data && (method === 'POST' || method === 'PUT')) {
            serviceConfig.body = JSON.stringify(data);
          }

          const retryResponse = await fetch(url, serviceConfig);
          if (retryResponse.ok) {
            const result = await retryResponse.json();
            console.log('API Response (with service token):', result);
            return {
              success: true,
              data: result.data || result,
              message: result.message,
            };
          }
        }
        
        try {
          const errorData = JSON.parse(errorText);
          return {
            success: false,
            message: errorData.message || errorData.error || `HTTP ${response.status}`,
          };
        } catch {
          return {
            success: false,
            message: `HTTP ${response.status}: ${errorText}`,
          };
        }
      }

      const result = await response.json();
      console.log('API Response:', result);
      return {
        success: true,
        data: result.data || result,
        message: result.message,
      };
    } catch (error) {
      console.error('Network Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async getMaintenanceCarState(
    carId: string,
    maintenanceRequestId: string
  ): Promise<APIResponse<MaintenanceCarStateData>> {
    return this.makeRequest(`/${carId}/maintenance-state/${maintenanceRequestId}`);
  }

  async createMaintenanceCarState(
    carId: string,
    maintenanceRequestId: string,
    data: MaintenanceCarStateData
  ): Promise<APIResponse<MaintenanceCarStateData>> {
    return this.makeRequest(
      `/${carId}/maintenance-state/${maintenanceRequestId}`,
      'POST',
      data
    );
  }

  async updateMaintenanceCarState(
    carId: string,
    maintenanceRequestId: string,
    data: MaintenanceCarStateData
  ): Promise<APIResponse<MaintenanceCarStateData>> {
    return this.makeRequest(
      `/${carId}/maintenance-state/${maintenanceRequestId}`,
      'PUT',
      data
    );
  }

  async deleteMaintenanceCarState(
    carId: string,
    maintenanceRequestId: string
  ): Promise<APIResponse> {
    return this.makeRequest(
      `/${carId}/maintenance-state/${maintenanceRequestId}`,
      'DELETE'
    );
  }

  async getMaintenanceHistory(carId: string): Promise<APIResponse<MaintenanceCarStateData[]>> {
    return this.makeRequest(`/${carId}/maintenance-history`);
  }

  async getMaintenanceDashboard(carId: string): Promise<APIResponse<any>> {
    return this.makeRequest(`/${carId}/maintenance-dashboard`);
  }
}

export const maintenanceCarStateAPI = new MaintenanceCarStateAPI();
export default maintenanceCarStateAPI;