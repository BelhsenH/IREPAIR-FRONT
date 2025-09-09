import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.6:8888';

interface ServiceData {
  type: string;
  name: string;
  nameAr: string;
  nameFr: string;
  description?: string;
  descriptionAr?: string;
  descriptionFr?: string;
  price: number;
  duration: string;
  includes?: string[];
  includesAr?: string[];
  includesFr?: string[];
}

export interface ServiceRequest {
  _id: string;
  carDetails?: {
    _id: string;
    marque: string;
    modele: string;
    numeroImmatriculation: string;
    vin: string;
    fuelType: string;
  };
  icarDetails?: {
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
  serviceDetails?: {
    _id: string;
    name: string;
    nameAr: string;
    nameFr: string;
    type: string;
    price: number;
    duration: string;
    description: string;
  };
  status: string;
  date: string;
  time: string;
  estimatedCost?: number;
  actualCost?: number;
  description?: string;
  notes?: string;
  paymentMethod: string;
  statusHistory: {
    status: string;
    timestamp: string;
    description?: string;
    updatedBy: string;
  }[];
  createdAt: string;
}

export const serviceAPI = {
  // Debug function to check authentication status
  async checkAuthStatus() {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      console.log('Auth token exists:', !!token);
      console.log('Token length:', token?.length || 0);
      
      // Also check for the wrong key (in case user hasn't logged in again)
      const wrongToken = await AsyncStorage.getItem('&auth_token');
      if (wrongToken && !token) {
        console.log('Found token with wrong key! Fixing...');
        await AsyncStorage.setItem('@auth_token', wrongToken);
        await AsyncStorage.removeItem('&auth_token');
        return { hasToken: true, fixed: true };
      }
      
      return { hasToken: !!token, fixed: false };
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { hasToken: false, fixed: false };
    }
  },

  // Service Management
  async getMyServices() {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      console.log('Making API call to:', `${API_BASE_URL}/api/maintenance/my-services`);
      console.log('Using token:', token ? 'Token present' : 'No token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/my-services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      return result;
    } catch (error) {
      console.error('Error fetching services:', error);
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          throw new Error('Cannot connect to server. Please check your internet connection and try again.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while fetching services');
    }
  },

  async createService(serviceData: ServiceData) {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      console.log('Creating service with data:', serviceData);
      console.log('API URL:', `${API_BASE_URL}/api/maintenance/services`);
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/services`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      console.log('Create service response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Create service error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || errorData.error || 'Failed to create service');
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('Service created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating service:', error);
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          throw new Error('Cannot connect to server. Please check your internet connection and try again.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while creating service');
    }
  },

  async updateService(serviceId: string, serviceData: Partial<ServiceData>) {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update service');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  async deleteService(serviceId: string) {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete service');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },

  // Service Request Management
  async getMyServiceRequests() {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/irepair/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service requests');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching service requests:', error);
      throw error;
    }
  },

  async updateServiceRequestStatus(
    requestId: string, 
    status: string, 
    description?: string, 
    actualCost?: number, 
    notes?: string
  ) {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/request/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, description, actualCost, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update service request status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating service request status:', error);
      throw error;
    }
  },

  async getServiceRequest(requestId: string) {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/request/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service request');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching service request:', error);
      throw error;
    }
  },

  // Call customer
  async callCustomer(phoneNumber: string) {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
        return true;
      } else {
        throw new Error('Phone calls not supported on this device');
      }
    } catch (error) {
      console.error('Error making phone call:', error);
      throw error;
    }
  }
};

export default serviceAPI;
