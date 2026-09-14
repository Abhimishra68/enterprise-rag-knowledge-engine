import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { postgresService } from './src/server/postgresService';

function databaseAndTelemetryPlugin(): Plugin {
  return {
    name: 'database-and-telemetry-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        // 1. RAG Telemetry
        if (url.startsWith('/api/rag/')) {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            try {
              const parsed = body ? JSON.parse(body) : {};
              res.end(JSON.stringify(parsed, null, 2));
            } catch {
              res.end(JSON.stringify({ status: 'success', raw: body }));
            }
          });
          return;
        }

        // 2. Database Status
        if (url === '/api/database/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const status = await postgresService.getStatus();
            res.statusCode = 200;
            res.end(JSON.stringify(status));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ connected: false, error: err?.message || String(err) }));
          }
          return;
        }

        // 3. Database Config (Save / Update credentials)
        if (url === '/api/database/config' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const parsed = JSON.parse(body);
              postgresService.saveConfig(parsed);
              const status = await postgresService.getStatus();
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, status }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
            }
          });
          return;
        }

        // 4. Fetch all students from PostgreSQL
        if (url === '/api/database/students' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const students = await postgresService.getAllStudents();
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, students, count: students.length }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err?.message || String(err), students: [] }));
          }
          return;
        }

        // 5. Insert new student into PostgreSQL
        if (url === '/api/database/student' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const student = JSON.parse(body);
              await postgresService.insertStudent(student);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, studentId: student.studentId }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
            }
          });
          return;
        }

        // 6. Initialize Database
        if (url === '/api/database/init' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const result = await postgresService.initializeDatabase();
            res.statusCode = 200;
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), databaseAndTelemetryPlugin()],
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
});

