import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

class FastPartsService {
  private static async getFastAuthHeaders(): Promise<HeadersInit> {
    // Use synchronous approach if possible, otherwise fallback to async
    let token: string | null = null;
    
    try {
      token = await AsyncStorage.getItem('@auth_token');
    } catch (error) {
      console.error('FastPartsService: Failed to get token:', error);
      throw new Error('No authentication token available');
    }

    if (!token) {
      throw new Error('No authentication token available');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  static async fastGetUserPartsRequests(params?: any): Promise<any> {
    console.log('🚀 FastPartsService.fastGetUserPartsRequests called with params:', params);
    try {
      console.log('🚀 FastPartsService: Starting direct fetch...');
      const startTime = Date.now();

      const headers = await this.getFastAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const url = `${config.apiUrl}/api/parts/requests/my${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      console.log('🌐 FastPartsService: Making request to:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ FastPartsService: Request timeout, aborting...');
        controller.abort();
      }, 5000); // 5 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      const fetchDuration = Date.now() - startTime;
      console.log(`⚡ FastPartsService: Fetch completed in ${fetchDuration}ms`);

      if (!response.ok) {
        console.error('FastPartsService: Response not ok:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const parseStart = Date.now();
      const data = await response.json();
      const parseDuration = Date.now() - parseStart;
      
      console.log(`📄 FastPartsService: JSON parsing took ${parseDuration}ms`);
      
      const totalDuration = Date.now() - startTime;
      console.log(`✅ FastPartsService: Total request completed in ${totalDuration}ms`);

      return data;
    } catch (error: any) {
      console.error('❌ FastPartsService: Request failed:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      throw error;
    }
  }

  static async fastGetConversations(): Promise<any> {
    try {
      console.log('🚀 FastPartsService: Starting conversations fetch...');
      const startTime = Date.now();

      const headers = await this.getFastAuthHeaders();
      const url = `${config.apiUrl}/api/parts/conversations`;
      
      console.log('🌐 FastPartsService: Making conversations request to:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ FastPartsService: Conversations timeout, aborting...');
        controller.abort();
      }, 5000);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      const fetchDuration = Date.now() - startTime;
      console.log(`⚡ FastPartsService: Conversations fetch completed in ${fetchDuration}ms`);

      if (!response.ok) {
        console.error('FastPartsService: Conversations response not ok:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const totalDuration = Date.now() - startTime;
      console.log(`✅ FastPartsService: Conversations request completed in ${totalDuration}ms`);

      return data;
    } catch (error: any) {
      console.error('❌ FastPartsService: Conversations request failed:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      throw error;
    }
  }
}

export default FastPartsService;