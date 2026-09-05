import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow LAN access from mobile phones on same Wi-Fi
    port: 3000
  }
});
