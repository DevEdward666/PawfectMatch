import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.petshop.app',
  appName: 'Pet Shop App',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;