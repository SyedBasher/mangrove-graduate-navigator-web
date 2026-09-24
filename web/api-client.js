import { MANGROVE_API_BASE } from './config.js';
import { supabase } from './runtime.js';

function endpoint(path) {
  return `${String(MANGROVE_API_BASE || '').replace(/\/$/, '')}${path}`;
}

async function accessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data?.session?.access_token;
  if (!token) throw new Error('AUTH_REQUIRED');
  return token;
}

async function privateRequest(path, body, { responseType = 'json' } = {}) {
  const token = await accessToken();
  const response = await fetch(endpoint(path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `PRIVATE_API_${response.status}`;
    try {
      const data = await response.clone().json();
      if (data?.error) message = String(data.error);
    } catch {}
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return responseType === 'text' ? response.text() : response.json();
}

export function generatePreview(sessionId, { country = 'BD' } = {}) {
  return privateRequest('/assessment/preview', {
    session_id: sessionId,
    country,
  });
}

export function generateFullReport(sessionId, { country = 'BD' } = {}) {
  return privateRequest('/report/generate', {
    session_id: sessionId,
    country,
  });
}

export function fetchFullReport(sessionId, language = 'en', { country = 'BD' } = {}) {
  return privateRequest('/report/full', {
    session_id: sessionId,
    language,
    country,
  }, { responseType: 'text' });
}


export function createBkashPayment(sessionId, { country = 'BD' } = {}) {
  return privateRequest('/payment/bkash/create', {
    session_id: sessionId,
    country,
  });
}

export function executeBkashPayment(sessionId, paymentIntentId, paymentId, { country = 'BD' } = {}) {
  return privateRequest('/payment/bkash/execute', {
    session_id: sessionId,
    payment_intent_id: paymentIntentId,
    payment_id: paymentId,
    country,
  });
}

export function queryBkashPayment(sessionId, paymentIntentId, paymentId, { country = 'BD' } = {}) {
  return privateRequest('/payment/bkash/query', {
    session_id: sessionId,
    payment_intent_id: paymentIntentId,
    payment_id: paymentId,
    country,
  });
}
