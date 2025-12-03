import { sanitizeResponse, sanitizeError, formatEmailRouting, validateJson, EmailRoutingSchema, generateIndonesianName } from '../utils.js';

export async function handleGetEmailRouting(request, env) {
  try {
    const url = new URL(request.url);
    const configId = url.searchParams.get('configId');

    let query = `
      SELECT 
        er.*,
        cc.name as cloudflare_config_name
      FROM email_routing er
      LEFT JOIN cloudflare_configs cc ON er.cloudflare_config_id = cc.id
      WHERE 1=1
    `;
    const params = [];

    if (configId) {
      query += ' AND er.cloudflare_config_id = ?';
      params.push(configId);
    }

    query += ' ORDER BY er.created_at DESC';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const emails = results.map(formatEmailRouting);

    return sanitizeResponse({
      success: true,
      emails
    });
  } catch (error) {
    console.error('Error fetching email routing:', error);
    return sanitizeError('Failed to fetch email routing', 500);
  }
}

export async function handleCreateEmailRouting(request, env) {
  try {
    const body = await request.json();
    const validated = validateJson(body, EmailRoutingSchema);

    // Get config
    const config = await env.DB.prepare(`
      SELECT * FROM cloudflare_configs WHERE id = ? AND is_active = true
    `).bind(validated.cloudflareConfigId).first();

    if (!config) {
      return sanitizeError('Configuration not found or inactive', 404);
    }

    // Get zone details
    const zoneResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${validated.zoneId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.api_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!zoneResponse.ok) {
      throw new Error(`Failed to get zone details: ${zoneResponse.status} ${zoneResponse.statusText}`);
    }

    const zoneData = await zoneResponse.json();
    const zoneName = zoneData.result.name;
    const fullEmail = `${validated.aliasPart}@${zoneName}`;

    // Create email routing rule
    const routingResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${validated.zoneId}/email/routing/rules`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.api_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: true,
          matchers: [
            {
              type: "literal",
              field: "to",
              value: fullEmail
            }
          ],
          actions: [
            {
              type: "forward",
              value: [validated.destinationEmail]
            }
          ],
          name: `Auto-generated via Email Manager - ${config.name}`
        })
      }
    );

    if (!routingResponse.ok) {
      const errorData = await routingResponse.json();
      throw new Error(`Failed to create routing rule: ${errorData.message || routingResponse.statusText}`);
    }

    const routingData = await routingResponse.json();
    const ruleId = routingData.result.id;

    // Save to database
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO email_routing (
        id, cloudflare_config_id, zone_id, zone_name, alias_part, full_email,
        rule_id, destination, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      validated.cloudflareConfigId,
      validated.zoneId,
      zoneName,
      validated.aliasPart,
      fullEmail,
      ruleId,
      validated.destinationEmail,
      true,
      now,
      now
    ).run();

    const email = await env.DB.prepare(`
      SELECT 
        er.*,
        cc.name as cloudflare_config_name
      FROM email_routing er
      LEFT JOIN cloudflare_configs cc ON er.cloudflare_config_id = cc.id
      WHERE er.id = ?
    `).bind(id).first();

    return sanitizeResponse({
      success: true,
      email: formatEmailRouting(email)
    });
  } catch (error) {
    console.error('Error creating email routing:', error);
    return sanitizeError(error.message || 'Failed to create email routing', 500);
  }
}

export async function handleDeleteEmailRouting(request, env, params) {
  try {
    const id = params.id;
    const body = await request.json();
    const { ruleId } = body;

    if (!ruleId) {
      return sanitizeError('Rule ID is required');
    }

    // Get email routing with config
    const email = await env.DB.prepare(`
      SELECT 
        er.*,
        cc.api_token,
        cc.name as config_name
      FROM email_routing er
      LEFT JOIN cloudflare_configs cc ON er.cloudflare_config_id = cc.id
      WHERE er.id = ?
    `).bind(id).first();

    if (!email) {
      return sanitizeError('Email routing not found', 404);
    }

    // Delete from Cloudflare API
    const deleteResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${email.zone_id}/email/routing/rules/${ruleId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${email.api_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new Error(`Failed to delete routing rule: ${errorData.message || deleteResponse.statusText}`);
    }

    // Delete from database
    await env.DB.prepare(`
      DELETE FROM email_routing WHERE id = ?
    `).bind(id).run();

    return sanitizeResponse({
      success: true,
      message: 'Email routing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email routing:', error);
    return sanitizeError(error.message || 'Failed to delete email routing', 500);
  }
}