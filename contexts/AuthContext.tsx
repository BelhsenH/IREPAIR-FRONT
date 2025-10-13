import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { authService } from '../scripts/auth-script';

interface AuthUser {
  _id: string;
  type: 'garagiste';
  nomGarage: string;
  adresse?: string;
  zoneGeo?: string;
  geolocation: {
    lat: number;
    lng: number;
  };
  nomResponsable: string;
  phoneNumber: string;
  email: string;
  typeService: string[];
  verified: boolean;
  serviceHistory?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug token changes
  useEffect(() => {
    console.log('🔐 AuthContext: Token changed to:', token ? 'TOKEN_EXISTS' : 'NULL');
  }, [token]);

  // Debug user changes
  useEffect(() => {
    console.log('👤 AuthContext: User changed to:', user ? user.nomResponsable : 'NULL');
  }, [user]);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    console.log('🔄 AuthContext: Loading stored auth...');
    
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      console.log('🔄 Stored token exists:', !!storedToken);
      console.log('🔄 Stored user exists:', !!storedUser);

      if (storedToken && storedUser) {
        console.log('🔄 Setting stored auth data...');
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('✅ Stored auth data loaded successfully');
      } else {
        console.log('⚠️ No stored auth data found');
      }
    } catch (error) {
      console.error('❌ Error loading stored auth:', error);
    } finally {
      console.log('🔄 AuthContext loading complete, isLoading set to false');
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const login = async (newToken: string, newUser: AuthUser) => {
    console.log('🔐 AuthContext.login called with token:', newToken?.substring(0, 20) + '...');
    console.log('🔐 AuthContext.login called with user:', newUser?.nomResponsable);
    
    try {
      console.log('🔐 Storing token and user in AsyncStorage...');
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, newToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
      ]);
      
      console.log('🔐 Setting token and user in state...');
      setToken(newToken);
      setUser(newUser);
      console.log('✅ AuthContext.login completed successfully');
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error removing auth data:', error);
      throw error;
    }
  };

  const updateUser = async (updatedUser: AuthUser) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUser,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
