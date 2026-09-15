import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'react-native-maps': path.resolve(__dirname, './src/scratch/mockMaps.ts'),
      'expo-auth-session': path.resolve(__dirname, './src/scratch/mockExpoAuth.ts'),
      'expo-web-browser': path.resolve(__dirname, './src/scratch/mockExpoAuth.ts'),
      'expo-crypto': path.resolve(__dirname, './src/scratch/mockExpoAuth.ts'),
      'expo-constants': path.resolve(__dirname, './src/scratch/mockExpoAuth.ts'),
      'expo-modules-core': path.resolve(__dirname, './src/scratch/mockExpoAuth.ts'),
      'expo-secure-store': path.resolve(__dirname, './src/scratch/mockExpoAuth.ts'),
      'expo-camera': path.resolve(__dirname, './src/scratch/mockExpoAuth.ts'),
    },
  },
});
