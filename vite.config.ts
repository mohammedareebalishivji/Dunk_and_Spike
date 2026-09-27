import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:3001',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
          if (id.includes('src/components/LiveScoringAdmin') || id.includes('src/components/AdminTeamsView') || id.includes('src/components/CreateMatchModal')) {
            return 'admin-tools';
          }
          if (id.includes('src/components/TournamentBracketView') || id.includes('src/components/StandingsTable')) {
            return 'tournament-stats';
          }
        },
      },
    },
  },
});
