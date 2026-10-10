import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { validateProdEnv } from './build/validateProdEnv.js';

function prodEnvGuardPlugin() {
  return {
    name: 'prod-env-guard',
    configResolved(config) {
      if (config.command === 'build' && config.mode === 'production') {
        const env = loadEnv(config.mode, process.cwd(), '');
        validateProdEnv(env);
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), prodEnvGuardPlugin()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'build/validateProdEnv.js',
        'src/services/teamsClient.js',
        'src/services/assistantClient.js',
        'src/services/auth.js',
        'src/components/assistant/**',
        'src/services/inventoryClient.js',
        'src/services/inventoryLocations.js',
        'src/services/inventoryCountsClient.js',
        'src/services/productionClient.js',
        'src/services/notificationsClient.js',
        'src/services/notificationRoutes.js',
        'src/hooks/**',
        'src/components/inventory/**',
        'src/components/notifications/**',
        'src/components/InventoryView.jsx',
        'src/components/DobleFiloCard.jsx',
        'src/components/CashCloseView.jsx',
        'src/components/cashclose/**',
        'src/components/cashconfig/**',
        'src/services/cashCloseClient.js',
        'src/services/cashConfigClient.js',
        'src/services/cashMovementsClient.js',
        'src/services/money.js'
      ],
      exclude: ['**/__tests__/**']
    }
  }
});
