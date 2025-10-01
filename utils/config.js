import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determine a sensible default for development
// - Android emulator: http://10.0.2.2:5000
// - iOS simulator:    http://localhost:5000
// - Physical devices: prefer setting extra.API_URL to your machine's LAN IP (e.g., http://192.168.1.10:5000)
const defaultDevBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

// Read API_URL from Expo extra if available
const extraApiUrl = Constants.expoConfig?.extra?.API_URL;

// In dev, prefer extra.API_URL if set, otherwise fallback to emulator/simulator defaults
// In prod, require extra.API_URL or fallback to a placeholder you should change
export const API_URL = __DEV__
  ? (extraApiUrl || defaultDevBaseUrl)
  : (extraApiUrl || 'https://your-production-api.example.com');

export const api = (path) => `${API_URL}${path}`;