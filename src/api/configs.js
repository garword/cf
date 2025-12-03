import { sanitizeResponse, sanitizeError, formatConfig, formatEmailRouting, validateJson, CloudflareConfigSchema } from '../utils.js';

export async function handleGetConfigs(request, env) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT * FROM cloudflare_configs 
      WHERE is_active = true 
      ORDER BY created_at ASC
    `).all();

    const configs = results.map(formatConfig);
    
    return sanitizeResponse({
      success: true,
      configs,
      count: configs.length
    });
  } catch (error) {
    console.error('Error fetching configs:', error);
    return sanitizeError('Failed to fetch configurations', 500);
  }
}

export async function handleCreateConfig(request, env) {
  try {
    const body = await request.json();
    const validated = validateJson(body, CloudflareConfigSchema);

    // Check max configurations
    const { count } = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM cloudflare_configs WHERE is_active = true
    `).first();

    if (count >= parseInt(env.MAX_CONFIGS || '4')) {
      return sanitizeError('Maximum 4 Cloudflare configurations allowed');
    }

    // Check unique name
    const existing = await env.DB.prepare(`
      SELECT id FROM cloudflare_configs WHERE name = ? AND is_active = true
    `).bind(validated.name).first();

    if (existing) {
      return sanitizeError('Configuration name already exists');
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO cloudflare_configs (
        id, name, api_token, account_id, d1_database, worker_api, kv_storage,
        destination_emails, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      validated.name,
      validated.apiToken,
      validated.accountId,
      validated.d1Database,
      validated.workerApi,
      validated.kvStorage,
      JSON.stringify(validated.destinationEmails),
      true,
      now,
      now
    ).run();

    const config = await env.DB.prepare(`
      SELECT * FROM cloudflare_configs WHERE id = ?
    `).bind(id).first();

    return sanitizeResponse({
      success: true,
      message: 'Configuration added successfully',
      config: formatConfig(config)
    });
  } catch (error) {
    console.error('Error creating config:', error);
    return sanitizeError(error.message || 'Failed to create configuration', 500);
  }
}

export async function handleUpdateConfig(request, env) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return sanitizeError('Configuration ID is required');
    }

    // Check if config exists
    const existing = await env.DB.prepare(`
      SELECT * FROM cloudflare_configs WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return sanitizeError('Configuration not found', 404);
    }

    // Validate update data if provided
    let validated = {};
    if (Object.keys(updateData).length > 0) {
      validated = validateJson({ ...existing, ...updateData }, CloudflareConfigSchema);
    }

    // Check unique name if changed
    if (validated.name && validated.name !== existing.name) {
      const nameExists = await env.DB.prepare(`
        SELECT id FROM cloudflare_configs WHERE name = ? AND id != ? AND is_active = true
      `).bind(validated.name, id).first();

      if (nameExists) {
        return sanitizeError('Configuration name already exists');
      }
    }

    const now = new Date().toISOString();
    const updates = [];
    const values = [];

    if (validated.name !== undefined) {
      updates.push('name = ?');
      values.push(validated.name);
    }
    if (validated.apiToken !== undefined) {
      updates.push('api_token = ?');
      values.push(validated.apiToken);
    }
    if (validated.accountId !== undefined) {
      updates.push('account_id = ?');
      values.push(validated.accountId);
    }
    if (validated.d1Database !== undefined) {
      updates.push('d1_database = ?');
      values.push(validated.d1Database);
    }
    if (validated.workerApi !== undefined) {
      updates.push('worker_api = ?');
      values.push(validated.workerApi);
    }
    if (validated.kvStorage !== undefined) {
      updates.push('kv_storage = ?');
      values.push(validated.kvStorage);
    }
    if (validated.destinationEmails !== undefined) {
      updates.push('destination_emails = ?');
      values.push(JSON.stringify(validated.destinationEmails));
    }
    if (validated.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(validated.isActive);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(now);
      values.push(id);

      await env.DB.prepare(`
        UPDATE cloudflare_configs SET ${updates.join(', ')} WHERE id = ?
      `).bind(...values).run();
    }

    const config = await env.DB.prepare(`
      SELECT * FROM cloudflare_configs WHERE id = ?
    `).bind(id).first();

    return sanitizeResponse({
      success: true,
      message: 'Configuration updated successfully',
      config: formatConfig(config)
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return sanitizeError(error.message || 'Failed to update configuration', 500);
  }
}

export async function handleDeleteConfig(request, env) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return sanitizeError('Configuration ID is required');
    }

    // Check if config has active email routing
    const { count } = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM email_routing 
      WHERE cloudflare_config_id = ? AND is_active = true
    `).bind(id).first();

    if (count > 0) {
      return sanitizeError('Cannot delete configuration with active email routing');
    }

    // Soft delete
    await env.DB.prepare(`
      UPDATE cloudflare_configs SET is_active = false, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), id).run();

    return sanitizeResponse({
      success: true,
      message: 'Configuration deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting config:', error);
    return sanitizeError('Failed to delete configuration', 500);
  }
}