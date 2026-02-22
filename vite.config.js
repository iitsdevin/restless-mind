import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // This must match your GitHub repository name exactly!
  // If your repo is named something else, change 'restless-mind' to match.
  base: '/restless-mind/', 
});
