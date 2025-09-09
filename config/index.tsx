import Constants from 'expo-constants';
interface Config {
    apiUrl: string;
    appName: string;
    version: string;
}
const isDevelopment = __DEV__;
const isProduction=!isDevelopment;

// Check if running on Android emulator
const isAndroidEmulator = Constants.platform?.android && Constants.isDevice === false;
const defaultApiUrl = isAndroidEmulator ? 'http://10.0.2.2:8888' : 'http://192.168.43.6:8888';

const config: Config = {
    apiUrl: defaultApiUrl,
    appName: Constants.expoConfig?.name || 'IREPAIR Mobile App',
    version: Constants.expoConfig?.version || '1.0.0',
}

if (isDevelopment) {
    config.apiUrl = defaultApiUrl;
}

if (isProduction) {
    //config.apiUrl = 'https://production-api.com/api';
}

export default config;
export type {Config};