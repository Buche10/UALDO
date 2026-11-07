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
};

export default config;
