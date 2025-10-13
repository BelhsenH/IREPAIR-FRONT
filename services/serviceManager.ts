import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';
import ConversationService from './conversationService';
import PartsService from './partsService';

class ServiceManager {
  private tokenUpdateListeners: ((token: string | null) => void)[] = [];

  constructor() {
    // Listen for token changes in AsyncStorage
    this.setupTokenListener();
  }

  private async setupTokenListener(): Promise<void> {
    // Check for token changes periodically (could be improved with event listeners)
    let lastToken = await AsyncStorage.getItem('@auth_token');
    
    setInterval(async () => {
      try {
        const currentToken = await AsyncStorage.getItem('@auth_token');
        if (currentToken !== lastToken) {
          lastToken = currentToken;
          this.onTokenUpdate(currentToken);
        }
      } catch (error) {
        console.warn('ServiceManager: Error checking token changes:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  private onTokenUpdate(newToken: string | null): void {
    console.log('ServiceManager: Token updated, clearing caches');
    
    // Update token in all services
    ApiService.updateToken(newToken);
    ConversationService.updateToken(newToken);
    
    // Clear all caches and pending requests
    this.clearAllCaches();
    
    // Notify listeners
    this.tokenUpdateListeners.forEach(listener => {
      try {
        listener(newToken);
      } catch (error) {
        console.warn('ServiceManager: Error in token update listener:', error);
      }
    });
  }

  public clearAllCaches(): void {
    console.log('ServiceManager: Clearing all service caches');
    ApiService.clearCache();
    PartsService.clearCache();
    ConversationService.clearCache();
  }

  public onTokenChange(callback: (token: string | null) => void): () => void {
    this.tokenUpdateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.tokenUpdateListeners.indexOf(callback);
      if (index > -1) {
        this.tokenUpdateListeners.splice(index, 1);
      }
    };
  }

  // Preload commonly used data
  public async preloadCommonData(): Promise<void> {
    try {
      console.log('ServiceManager: Preloading common data');
      
      // Load categories and user requests in parallel
      const promises = [
        PartsService.getCategories().catch(err => console.warn('Failed to preload categories:', err)),
        PartsService.getUserPartsRequests({ page: 1, limit: 10 }).catch(err => console.warn('Failed to preload user requests:', err)),
        PartsService.getUnreadCount().catch(err => console.warn('Failed to preload unread count:', err)),
      ];

      await Promise.allSettled(promises);
      console.log('ServiceManager: Common data preloaded');
    } catch (error) {
      console.warn('ServiceManager: Error preloading common data:', error);
    }
  }

  // Force refresh all data
  public async refreshAllData(): Promise<void> {
    console.log('ServiceManager: Refreshing all data');
    this.clearAllCaches();
    await this.preloadCommonData();
  }
}

export default new ServiceManager();