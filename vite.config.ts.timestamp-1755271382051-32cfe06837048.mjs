// vite.config.ts
import { defineConfig } from "file:///home/runner/workspace/node_modules/vite/dist/node/index.js";
import react from "file:///home/runner/workspace/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/home/runner/workspace";
var vite_config_default = defineConfig(({ mode }) => {
  console.log("[vite] \u{1F680} Config loaded \u2013 mode:", mode);
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      port: 5e3,
      host: "0.0.0.0",
      strictPort: true,
      allowedHosts: [
        ".replit.dev",
        // Wildcard for all Replit subdomains
        ".riker.replit.dev",
        // Specific Replit infrastructure
        "localhost"
        // Local development
      ],
      hmr: {
        port: 5001,
        host: "0.0.0.0",
        // Wichtig für Replit WebSocket-Zugriff
        overlay: false,
        timeout: 3e4,
        // Reduzierter Timeout
        clientErrorOverlay: false,
        reconnectionAttempts: 2,
        // Weniger Reconnect-Versuche
        skipSSLVerification: true
        // Für Replit SSL-Probleme
      },
      watch: {
        usePolling: false,
        interval: 1e3,
        ignored: ["**/node_modules/**", "**/.git/**"]
        // Weniger File-Watching
      },
      cors: true
      // CORS für WebSocket-Verbindungen
    },
    preview: {
      host: true,
      port: 3e3,
      allowedHosts: [
        ".replit.dev",
        ".riker.replit.dev"
      ]
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "development",
      minify: mode === "production" ? "esbuild" : false,
      target: "es2015",
      // Better mobile compatibility
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            router: ["react-router-dom"],
            firebase: ["firebase/app", "firebase/auth", "firebase/firestore"]
          }
        }
      }
    },
    optimizeDeps: {
      include: ["react", "react-dom", "firebase/app", "firebase/auth", "firebase/firestore"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9ydW5uZXIvd29ya3NwYWNlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9ydW5uZXIvd29ya3NwYWNlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3J1bm5lci93b3Jrc3BhY2Uvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zb2xlLmxvZygnW3ZpdGVdIFx1RDgzRFx1REU4MCBDb25maWcgbG9hZGVkIFx1MjAxMyBtb2RlOicsIG1vZGUpXG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKVxuICAgICAgfVxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0OiA1MDAwLFxuICAgICAgaG9zdDogJzAuMC4wLjAnLFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICAgIGFsbG93ZWRIb3N0czogW1xuICAgICAgICAnLnJlcGxpdC5kZXYnLCAgICAgICAgIC8vIFdpbGRjYXJkIGZvciBhbGwgUmVwbGl0IHN1YmRvbWFpbnNcbiAgICAgICAgJy5yaWtlci5yZXBsaXQuZGV2JywgICAvLyBTcGVjaWZpYyBSZXBsaXQgaW5mcmFzdHJ1Y3R1cmVcbiAgICAgICAgJ2xvY2FsaG9zdCcgICAgICAgICAgICAvLyBMb2NhbCBkZXZlbG9wbWVudFxuICAgICAgXSxcbiAgICAgIGhtcjoge1xuICAgICAgICBwb3J0OiA1MDAxLFxuICAgICAgICBob3N0OiAnMC4wLjAuMCcsICAgICAgICAgICAvLyBXaWNodGlnIGZcdTAwRkNyIFJlcGxpdCBXZWJTb2NrZXQtWnVncmlmZlxuICAgICAgICBvdmVybGF5OiBmYWxzZSxcbiAgICAgICAgdGltZW91dDogMzAwMDAsICAgICAgICAgICAgLy8gUmVkdXppZXJ0ZXIgVGltZW91dFxuICAgICAgICBjbGllbnRFcnJvck92ZXJsYXk6IGZhbHNlLFxuICAgICAgICByZWNvbm5lY3Rpb25BdHRlbXB0czogMiwgICAvLyBXZW5pZ2VyIFJlY29ubmVjdC1WZXJzdWNoZVxuICAgICAgICBza2lwU1NMVmVyaWZpY2F0aW9uOiB0cnVlLCAvLyBGXHUwMEZDciBSZXBsaXQgU1NMLVByb2JsZW1lXG4gICAgICB9LFxuICAgICAgd2F0Y2g6IHtcbiAgICAgICAgdXNlUG9sbGluZzogZmFsc2UsXG4gICAgICAgIGludGVydmFsOiAxMDAwLFxuICAgICAgICBpZ25vcmVkOiBbJyoqL25vZGVfbW9kdWxlcy8qKicsICcqKi8uZ2l0LyoqJ10sIC8vIFdlbmlnZXIgRmlsZS1XYXRjaGluZ1xuICAgICAgfSxcbiAgICAgIGNvcnM6IHRydWUsIC8vIENPUlMgZlx1MDBGQ3IgV2ViU29ja2V0LVZlcmJpbmR1bmdlblxuICAgIH0sXG4gICAgcHJldmlldzoge1xuICAgICAgaG9zdDogdHJ1ZSxcbiAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICBhbGxvd2VkSG9zdHM6IFtcbiAgICAgICAgJy5yZXBsaXQuZGV2JyxcbiAgICAgICAgJy5yaWtlci5yZXBsaXQuZGV2J1xuICAgICAgXVxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgc291cmNlbWFwOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnLFxuICAgICAgbWluaWZ5OiBtb2RlID09PSAncHJvZHVjdGlvbicgPyAnZXNidWlsZCcgOiBmYWxzZSxcbiAgICAgIHRhcmdldDogJ2VzMjAxNScsIC8vIEJldHRlciBtb2JpbGUgY29tcGF0aWJpbGl0eVxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICAgIHJvdXRlcjogWydyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgICBmaXJlYmFzZTogWydmaXJlYmFzZS9hcHAnLCAnZmlyZWJhc2UvYXV0aCcsICdmaXJlYmFzZS9maXJlc3RvcmUnXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBpbmNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdmaXJlYmFzZS9hcHAnLCAnZmlyZWJhc2UvYXV0aCcsICdmaXJlYmFzZS9maXJlc3RvcmUnXVxuICAgIH1cbiAgfVxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQW9QLFNBQVMsb0JBQW9CO0FBQ2pSLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsVUFBUSxJQUFJLCtDQUFtQyxJQUFJO0FBRW5ELFNBQU87QUFBQSxJQUNMLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxJQUNqQixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixjQUFjO0FBQUEsUUFDWjtBQUFBO0FBQUEsUUFDQTtBQUFBO0FBQUEsUUFDQTtBQUFBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsS0FBSztBQUFBLFFBQ0gsTUFBTTtBQUFBLFFBQ04sTUFBTTtBQUFBO0FBQUEsUUFDTixTQUFTO0FBQUEsUUFDVCxTQUFTO0FBQUE7QUFBQSxRQUNULG9CQUFvQjtBQUFBLFFBQ3BCLHNCQUFzQjtBQUFBO0FBQUEsUUFDdEIscUJBQXFCO0FBQUE7QUFBQSxNQUN2QjtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsWUFBWTtBQUFBLFFBQ1osVUFBVTtBQUFBLFFBQ1YsU0FBUyxDQUFDLHNCQUFzQixZQUFZO0FBQUE7QUFBQSxNQUM5QztBQUFBLE1BQ0EsTUFBTTtBQUFBO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sY0FBYztBQUFBLFFBQ1o7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLFdBQVcsU0FBUztBQUFBLE1BQ3BCLFFBQVEsU0FBUyxlQUFlLFlBQVk7QUFBQSxNQUM1QyxRQUFRO0FBQUE7QUFBQSxNQUNSLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGNBQWM7QUFBQSxZQUNaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxZQUM3QixRQUFRLENBQUMsa0JBQWtCO0FBQUEsWUFDM0IsVUFBVSxDQUFDLGdCQUFnQixpQkFBaUIsb0JBQW9CO0FBQUEsVUFDbEU7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLFNBQVMsQ0FBQyxTQUFTLGFBQWEsZ0JBQWdCLGlCQUFpQixvQkFBb0I7QUFBQSxJQUN2RjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
