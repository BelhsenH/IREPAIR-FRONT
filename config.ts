import Constants from 'expo-constants';

interface Config {
  apiUrl: string;
  appName: string;
  version: string;
}

const isDevelopment = __DEV__;
const isProduction = !isDevelopment;

const config: Config = {
  apiUrl: 'http://192.168.43.6:8888',
  appName: Constants.expoConfig?.name || 'IREPAIR Mobile App',
  version: Constants.expoConfig?.version || '1.0.0',
};

// Override for different environments
if (isDevelopment) {
  // Use localhost for Expo web/iOS simulator
  // Use your computer's IP for physical devices/Android emulator
  config.apiUrl = 'http://192.168.43.6:8888'; // IP address for remote access
}

if (isProduction) {
  // You can set your production API URL here
  // config.apiUrl = 'https://your-production-api.com/api';
}

export default config;
export type { Config };