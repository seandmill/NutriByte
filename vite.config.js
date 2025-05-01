import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Get environment variables with fallbacks
const PORT = process.env.PORT || 8080
const API_URL = process.env.NODE_ENV === 'production' 
    ? '' // Empty string means same origin in production
    : `http://localhost:${PORT}`

export default defineConfig({
    plugins: [react()],
    root: 'src', // Set source root back to src
    publicDir: resolve(__dirname, 'public'), // Use absolute path for publicDir
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src') // Alias relative to project root
        }
    },
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.(js|jsx)$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
    server: {
        port: PORT,
        host: process.env.NODE_ENV === 'production' ? 'localhost' : '0.0.0.0',
        hmr: {
            port: process.env.HMR_PORT || 24678
        },
        proxy: process.env.NODE_ENV === 'production' ? {} : {
            '/api': {
                target: API_URL,
                changeOrigin: true,
                secure: false,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        console.log('Sending Request:', req.method, req.url);
                    });
                    proxy.on('proxyRes', (proxyRes, req, _res) => {
                        console.log('Received Response:', proxyRes.statusCode, req.url);
                    });
                }
            }
        }
    },
    build: {
        outDir: resolve(__dirname, 'dist'), // Use absolute path for outDir
        emptyOutDir: true,
        // No need for rollupOptions.input when root is 'src'
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled']
                }
            }
        }
    }
})