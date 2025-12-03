import { z } from 'zod';

// Validation schemas
const CloudflareConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  apiToken: z.string().min(1, 'API token is required'),
  accountId: z.string().min(1, 'Account ID is required'),
  d1Database: z.string().min(1, 'D1 database is required'),
  workerApi: z.string().min(1, 'Worker API is required'),
  kvStorage: z.string().min(1, 'KV storage is required'),
  destinationEmails: z.array(z.string().email()).default([]),
});

const EmailRoutingSchema = z.object({
  cloudflareConfigId: z.string().min(1, 'Cloudflare config ID is required'),
  zoneId: z.string().min(1, 'Zone ID is required'),
  aliasPart: z.string().min(1, 'Alias part is required'),
  destinationEmail: z.string().email('Valid destination email is required'),
});

// Utility functions
export function validateJson(json, schema) {
  try {
    return schema.parse(json);
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`);
  }
}

export function sanitizeResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export function sanitizeError(message, status = 400) {
  return sanitizeResponse({ success: false, error: message }, status);
}

export function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export function generateId() {
  return crypto.randomUUID();
}

export function formatConfig(config) {
  const parsedEmails = JSON.parse(config.destination_emails || '[]');
  return {
    id: config.id,
    name: config.name,
    apiToken: config.api_token ? "***" + config.api_token.slice(-4) : "",
    accountId: config.account_id ? "***" + config.account_id.slice(-4) : "",
    d1Database: config.d1_database ? "***" + config.d1_database.slice(-4) : "",
    workerApi: config.worker_api ? "***" + config.worker_api.slice(-4) : "",
    kvStorage: config.kv_storage ? "***" + config.kv_storage.slice(-4) : "",
    destinationEmails: parsedEmails,
    isActive: Boolean(config.is_active),
    createdAt: config.created_at,
    updatedAt: config.updated_at,
    _full: {
      apiToken: config.api_token,
      accountId: config.account_id,
      d1Database: config.d1_database,
      workerApi: config.worker_api,
      kvStorage: config.kv_storage,
      destinationEmails: parsedEmails,
    }
  };
}

export function formatEmailRouting(email) {
  return {
    id: email.id,
    cloudflareConfigId: email.cloudflare_config_id,
    zoneId: email.zone_id,
    zoneName: email.zone_name,
    aliasPart: email.alias_part,
    fullEmail: email.full_email,
    ruleId: email.rule_id,
    destination: email.destination,
    isActive: Boolean(email.is_active),
    createdAt: email.created_at,
    updatedAt: email.updated_at,
    cloudflareConfig: email.cloudflare_config_name ? {
      id: email.cloudflare_config_id,
      name: email.cloudflare_config_name,
    } : undefined,
  };
}

// Indonesian name generator
const indonesianFirstNames = [
  "budi", "siti", "agus", "dewi", "eko", "rina", "fajar", "dian", "rizky", "nur",
  "andi", "maya", "hendra", "sari", "joko", "putri", "bayu", "fitri", "dimas", "angga",
  "wati", "bambang", "yuni", "doni", "indah", "reza", "kartika", "ahmad", "susanti", "pratama"
];

const indonesianLastNames = [
  "santoso", "pratama", "wijaya", "kusuma", "hidayat", "saputra", "wulandari", "nugroho",
  "siregar", "nasution", "putra", "dewi", "pertiwi", "permata", "cahyono", "rahman",
  "hakim", "fauzi", "subekti", "marlina", "handoko", "susilo", "fitriani", "rahmawati"
];

export function generateIndonesianName() {
  const firstName = indonesianFirstNames[Math.floor(Math.random() * indonesianFirstNames.length)];
  const lastName = indonesianLastNames[Math.floor(Math.random() * indonesianLastNames.length)];
  const randomSuffix = Math.random().toString(36).substring(2, 5);
  return `${firstName}${lastName}${randomSuffix}`;
}