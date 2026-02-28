/**
 * Helpers para interagir com a API diretamente
 * Útil para setup de dados de teste
 */

const API_BASE = 'http://localhost:8000/api';

/**
 * Criar pedido de recursos via API
 */
export async function createResourceRequestViaAPI(token, data) {
  const response = await fetch(`${API_BASE}/resources/requests`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create resource request: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Criar lote de produtos via API
 */
export async function createBatchViaAPI(token, data) {
  const response = await fetch(`${API_BASE}/batches/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create batch: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Marcar lote como pronto via API
 */
export async function markBatchReadyViaAPI(token, batchId) {
  const response = await fetch(`${API_BASE}/batches/${batchId}/mark-ready`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to mark batch as ready: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Criar reserva de recursos via API
 */
export async function createReservationViaAPI(token, data) {
  const response = await fetch(`${API_BASE}/resources/reservations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create reservation: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Criar entrega via API
 */
export async function createDeliveryViaAPI(token, data) {
  const response = await fetch(`${API_BASE}/deliveries/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create delivery: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Obter token de autenticação
 */
export async function getAuthToken(email, password) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Failed to login: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

/**
 * Limpar dados de teste (usar com cuidado!)
 */
export async function cleanupTestData(token) {
  // Implementar limpeza se necessário
  // Por enquanto, apenas um placeholder
  console.log('Cleanup not implemented yet');
}
