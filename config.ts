import Constants from 'expo-constants';

interface Config {
  apiUrl: string;
  appName: string;
  version: string;
}

const isDevelopment = __DEV__;
const isProduction = !isDevelopment;

const config: Config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://162.19.66.250:6892',
  appName: Constants.expoConfig?.name || 'IREPAIR Mobile App',
  version: Constants.expoConfig?.version || '1.0.0',
};

// Override for different environments
if (isDevelopment) {
  // Use environment variable or fallback to IP address for remote access
  config.apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://162.19.66.250:6892';
}

if (isProduction) {
  // You can set your production API URL here
  // config.apiUrl = 'https://your-production-api.com/api';
}

export default config;
export type { Config };
