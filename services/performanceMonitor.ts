import AsyncStorage from '@react-native-async-storage/async-storage';

class PerformanceMonitor {
  private requestTimings: Map<string, number> = new Map();
  private tokenAccessTiming: number[] = [];

  startRequest(requestKey: string): void {
    this.requestTimings.set(requestKey, Date.now());
    console.log(`🚀 [Performance] Starting request: ${requestKey}`);
  }

  endRequest(requestKey: string): void {
    const startTime = this.requestTimings.get(requestKey);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`✅ [Performance] Request completed: ${requestKey} in ${duration}ms`);
      this.requestTimings.delete(requestKey);
      
      if (duration > 3000) {
        console.warn(`🐌 [Performance] SLOW REQUEST: ${requestKey} took ${duration}ms`);
      }
    }
  }

  async measureTokenAccess(): Promise<string | null> {
    const start = Date.now();
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const duration = Date.now() - start;
      this.tokenAccessTiming.push(duration);
      
      console.log(`🔑 [Performance] Token access took ${duration}ms`);
      
      // Keep only last 10 measurements
      if (this.tokenAccessTiming.length > 10) {
        this.tokenAccessTiming.shift();
      }
      
      const avgTime = this.tokenAccessTiming.reduce((a, b) => a + b, 0) / this.tokenAccessTiming.length;
      
      if (duration > 100) {
        console.warn(`🐌 [Performance] SLOW token access: ${duration}ms (avg: ${avgTime.toFixed(1)}ms)`);
      }
      
      return token;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ [Performance] Token access failed after ${duration}ms:`, error);
      return null;
    }
  }

  logNetworkRequest(url: string, method: string, duration: number): void {
    console.log(`🌐 [Performance] ${method} ${url} - ${duration}ms`);
    
    if (duration > 2000) {
      console.warn(`🐌 [Performance] SLOW network request: ${method} ${url} took ${duration}ms`);
    }
  }

  clearStats(): void {
    this.requestTimings.clear();
    this.tokenAccessTiming = [];
    console.log('📊 [Performance] Stats cleared');
  }

  getStats(): object {
    return {
      activeRequests: Array.from(this.requestTimings.keys()),
      avgTokenAccessTime: this.tokenAccessTiming.reduce((a, b) => a + b, 0) / this.tokenAccessTiming.length || 0,
      tokenAccessCount: this.tokenAccessTiming.length,
    };
  }
}

export default new PerformanceMonitor();