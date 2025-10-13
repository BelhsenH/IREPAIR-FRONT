import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

export interface Message {
  _id: string;
  senderId: string;
  senderType?: 'icar' | 'ipiece' | 'irepair';
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
    userType: 'icar' | 'ipiece' | 'irepair';
  };
  content: string;
  images?: string[];
  voiceMessage?: { uri: string; duration: number };
  timestamp?: Date;
  createdAt?: Date;
}

export interface Conversation {
  _id: string;
  partsRequest: string;
  participants: {
    userId: string;
    userType: 'icar' | 'ipiece' | 'irepair';
    user?: {
      _id: string;
      firstName: string;
      lastName: string;
      userType: 'icar' | 'ipiece' | 'irepair';
    };
    unreadCount?: number;
  }[];
  messages: Message[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

class ConversationService {
  private tokenCache: string | null = null;
  private tokenPromise: Promise<string | null> | null = null;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly REQUEST_TIMEOUT = 8000; // 8 seconds timeout

  constructor() {
    this.initializeToken();
  }

  private async initializeToken(): Promise<void> {
    try {
      this.tokenCache = await AsyncStorage.getItem('@auth_token');
    } catch (error) {
      console.warn('Failed to initialize token cache:', error);
    }
  }

  private async getToken(): Promise<string | null> {
    // Return cached token immediately if available
    if (this.tokenCache) {
      return this.tokenCache;
    }

    // If already fetching token, wait for that promise
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // Create new promise to fetch token
    this.tokenPromise = AsyncStorage.getItem('@auth_token').then(token => {
      this.tokenCache = token;
      this.tokenPromise = null;
      return token;
    }).catch(error => {
      console.warn('Failed to get token:', error);
      this.tokenPromise = null;
      return null;
    });

    return this.tokenPromise;
  }

  private async getAuthHeaders() {
    try {
      const token = await this.getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('ConversationService: Error getting auth headers:', error);
      throw error;
    }
  }

  // Debounce similar requests to prevent multiple identical API calls
  private async makeRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  public updateToken(newToken: string | null): void {
    this.tokenCache = newToken;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Token expired, clear cache
      this.tokenCache = null;
      console.warn('ConversationService: 401 Unauthorized - token may be invalid for this service');
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Request failed');
    }
    
    return response.json();
  }

  getApiUrl() {
    return config.apiUrl;
  }

  async getConversations(): Promise<Conversation[]> {
    const requestKey = 'getConversations';
    
    return this.makeRequest(requestKey, async () => {
      try {
        const headers = await this.getAuthHeaders();
        const url = `${config.apiUrl}/api/parts/conversations`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await this.handleResponse(response);
        
        return data;
      } catch (error: any) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        console.error('Error fetching conversations:', error.message || error);
        throw error;
      }
    });
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const requestKey = `getConversation_${conversationId}`;
    
    return this.makeRequest(requestKey, async () => {
      try {
        const headers = await this.getAuthHeaders();
        
        // Add timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
        
        const response = await fetch(`${config.apiUrl}/api/parts/conversations/${conversationId}`, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return await this.handleResponse(response);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        console.error('Error fetching conversation:', error);
        throw error;
      }
    });
  }

  async sendMessage(
    conversationId: string,
    content: string,
    images?: string[]
  ): Promise<Message> {
    try {
      const headers = await this.getAuthHeaders();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const response = await fetch(`${config.apiUrl}/api/parts/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          content, 
          images
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return await this.handleResponse(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async createConversation(partsRequestId: string, initialMessage?: string): Promise<Conversation> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          partsRequestId,
          initialMessage 
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async initiateConversationWithRequester(
    partsRequestId: string, 
    initialMessage?: string, 
    offerDetails?: {
      price?: number;
      currency?: string;
      availability?: string;
      deliveryTime?: string;
      condition?: string;
      warranty?: string;
    }
  ): Promise<{
    conversation: Conversation;
    isExisting: boolean;
    message: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/conversations/initiate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          partsRequestId,
          initialMessage,
          offerDetails
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error initiating conversation with requester:', error);
      throw error;
    }
  }

  async markAsRead(conversationId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers,
      });

      await this.handleResponse(response);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  async uploadImages(images: any[]): Promise<string[]> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `image_${index}.jpg`,
        } as any);
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds for uploads

      const response = await fetch(`${config.apiUrl}/api/parts/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await this.handleResponse(response);
      return data.imageUrls;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timeout');
      }
      console.error('Error uploading images:', error);
      throw error;
    }
  }

  // Debug methods for testing
  async createTestConversation(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/conversations/test/create`, {
        method: 'POST',
        headers,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating test conversation:', error);
      throw error;
    }
  }

  async debugConversations(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/conversations/debug/list`, {
        method: 'GET',
        headers,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error debugging conversations:', error);
      throw error;
    }
  }

  // Utility methods
  public clearPendingRequests(): void {
    this.pendingRequests.clear();
  }

  public clearCache(): void {
    this.clearPendingRequests();
  }
}

export default new ConversationService();
