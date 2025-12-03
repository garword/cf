import { Router } from 'itty-router';
import { handleCORS } from './utils.js';
import { handleGetConfigs, handleCreateConfig, handleUpdateConfig, handleDeleteConfig } from './api/configs.js';
import { handleGetZones } from './api/zones.js';
import { handleGetEmailRouting, handleCreateEmailRouting, handleDeleteEmailRouting } from './api/email-routing.js';

const router = Router();

// CORS preflight
router.options('*', handleCORS);

// Health check
router.get('/', () => new Response('Email Routing Manager API is running!'));

// Configuration routes
router.get('/api/configs', handleGetConfigs);
router.post('/api/configs', handleCreateConfig);
router.put('/api/configs', handleUpdateConfig);
router.delete('/api/configs', handleDeleteConfig);

// Zones routes
router.get('/api/zones', handleGetZones);

// Email routing routes
router.get('/api/email-routing', handleGetEmailRouting);
router.post('/api/email-routing', handleCreateEmailRouting);
router.delete('/api/email-routing/:id', handleDeleteEmailRouting);

// Static assets
router.get('/styles.css', async () => {
  const styles = await fetch('./public/styles.css');
  return new Response(styles.body, {
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
});

router.get('/favicon.ico', () => {
  return new Response(null, { status: 404 });
});

// Serve the main app
router.get('*', async (request) => {
  const html = await fetch('./public/index.html');
  return new Response(html.body, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Unhandled error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};