import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    root: 'src', // Tell Vite that index.html is in src directory
    publicDir: 'public', // Relative to the project root (where vite.config.js is)
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    // Add top-level esbuild config again
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.(js|jsx)$/, // Include both .js and .jsx in src
        exclude: [],
    },
    // Focus JSX handling within optimizeDeps for the dependency scan phase
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx', // Keep this for dependency scanning too
            },
        },
    },
    server: {
        host: '0.0.0.0',
        port: 8080,
        hmr: {
            // Avoid HMR conflicts
            port: 24678
        },
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
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
        outDir: 'dist', // Output build files to dist at root
        emptyOutDir: true, // Ensure clean build
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