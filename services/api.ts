import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';
import PerformanceMonitor from './performanceMonitor';

class ApiService {
  private baseURL: string;
  private tokenCache: string | null = null;
  private tokenPromise: Promise<string | null> | null = null;
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds timeout

  constructor() {
    this.baseURL = config.apiUrl;
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
      PerformanceMonitor.logNetworkRequest('token-cache-hit', 'CACHE', 0);
      return this.tokenCache;
    }

    // If already fetching token, wait for that promise
    if (this.tokenPromise) {
      PerformanceMonitor.logNetworkRequest('token-promise-wait', 'WAIT', 0);
      return this.tokenPromise;
    }

    // Create new promise to fetch token with monitoring
    this.tokenPromise = PerformanceMonitor.measureTokenAccess().then(token => {
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

  private getCacheKey(endpoint: string, options: RequestInit): string {
    return `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || {})}`;
  }

  private isRequestCacheable(endpoint: string, method: string): boolean {
    return method === 'GET' && !endpoint.includes('/upload');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const method = options.method || 'GET';
    const cacheKey = this.getCacheKey(endpoint, options);
    const requestKey = `${method} ${endpoint}`;
    
    PerformanceMonitor.startRequest(requestKey);
    
    // Check cache for GET requests
    if (this.isRequestCacheable(endpoint, method)) {
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        PerformanceMonitor.endRequest(requestKey);
        PerformanceMonitor.logNetworkRequest(endpoint, method, 0);
        return cached.data;
      }
    }

    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getToken();
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    };

    try {
      const networkStart = Date.now();
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      
      const networkDuration = Date.now() - networkStart;
      PerformanceMonitor.logNetworkRequest(endpoint, method, networkDuration);
      
      if (response.status === 401) {
        // Token expired, clear cache
        this.tokenCache = null;
        this.requestCache.clear();
        PerformanceMonitor.endRequest(requestKey);
        throw new Error('Unauthorized - token expired');
      }
      
      if (!response.ok) {
        PerformanceMonitor.endRequest(requestKey);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const parseStart = Date.now();
      const data = await response.json();
      const parseDuration = Date.now() - parseStart;
      
      if (parseDuration > 100) {
        console.log(`🔄 [Performance] JSON parsing took ${parseDuration}ms`);
      }
      
      // Cache successful GET requests
      if (this.isRequestCacheable(endpoint, method)) {
        this.requestCache.set(cacheKey, { data, timestamp: Date.now() });
        
        // Clean old cache entries periodically
        if (this.requestCache.size > 100) {
          this.cleanCache();
        }
      }
      
      PerformanceMonitor.endRequest(requestKey);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      PerformanceMonitor.endRequest(requestKey);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      console.error('API request failed:', error);
      throw error;
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, { timestamp }] of this.requestCache.entries()) {
      if (now - timestamp > this.CACHE_DURATION) {
        this.requestCache.delete(key);
      }
    }
  }

  public clearCache(): void {
    this.requestCache.clear();
  }

  public updateToken(newToken: string | null): void {
    this.tokenCache = newToken;
    if (!newToken) {
      this.requestCache.clear();
    }
  }

  async get(endpoint: string) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();