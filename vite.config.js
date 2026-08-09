import { defineConfig } from 'vite';

export default defineConfig({
  base: '/jenkins-conservatory/',
  build: {
    target: 'es2020'
  }
});
