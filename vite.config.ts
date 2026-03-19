import { defineConfig } from 'vite'

export default defineConfig({
  base: '/app-sideproj/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        uploads: 'uploads.html',
        workspace: 'workspace.html',
        login: 'login.html',
      },
    },
  },
})