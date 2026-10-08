import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CAP_DEV === '1';

const config: CapacitorConfig = {
  appId: 'com.ualdo.ecosystem',
  appName: 'UALDO',
  webDir: 'dist',
  server: {
    cleartext: isDev,
  },
  android: {
    allowMixedContent: isDev,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1d1d1b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
