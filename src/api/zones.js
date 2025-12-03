import { sanitizeResponse, sanitizeError } from '../utils.js';

export async function handleGetZones(request, env) {
  try {
    const url = new URL(request.url);
    const configId = url.searchParams.get('configId');

    if (!configId) {
      return sanitizeError('Config ID is required');
    }

    // Get config
    const config = await env.DB.prepare(`
      SELECT * FROM cloudflare_configs WHERE id = ? AND is_active = true
    `).bind(configId).first();

    if (!config) {
      return sanitizeError('Configuration not found or inactive', 404);
    }

    // Fetch zones from Cloudflare API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones?status=active&per_page=50`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.api_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return sanitizeResponse({
      success: true,
      configId: config.id,
      configName: config.name,
      zones: data.result || []
    });
  } catch (error) {
    console.error('Error fetching zones:', error);
    return sanitizeError(error.message || 'Failed to fetch zones', 500);
  }
}