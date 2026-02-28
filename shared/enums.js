/**
 * Enums compartilhados entre frontend e backend
 * Arquivo central para evitar inconsistências de case sensitivity
 */

// ============================================================================
// ORDER STATUS ENUM
// ============================================================================
export const OrderStatus = {
  IDLE: 'idle',
  REQUESTING: 'requesting', 
  OFFERING: 'offering',
  PARTIALLY_RESERVED: 'partially_reserved',
  RESERVED: 'reserved',
  IN_PROGRESS: 'in_progress',
  AWAITING_PICKUP: 'awaiting_pickup',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  PENDING_CONFIRMATION: 'pending_confirmation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} ;


// ============================================================================
// BATCH STATUS ENUM  
// ============================================================================
export const BatchStatus = {
  PRODUCING: 'producing',
  READY: 'ready',
  RESERVED: 'reserved',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
} ;


// ============================================================================
// PRODUCT TYPE ENUM
// ============================================================================
export const ProductType = {
  MEAL: 'meal',
  INGREDIENT: 'ingredient',
  CLOTHING: 'clothing',
  HYGIENE: 'hygiene',
  CLEANING: 'cleaning',
  SCHOOL_SUPPLIES: 'school_supplies',
  BABY_ITEMS: 'baby_items',
  PET_SUPPLIES: 'pet_supplies'
} ;


// ============================================================================
// USER ROLES ENUM
// ============================================================================
export const UserRole = {
  PROVIDER: 'provider',
  VOLUNTEER: 'volunteer', 
  SHELTER: 'shelter',
  ADMIN: 'admin'
} ;


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se um status é válido
 */
export function isValidOrderStatus(status) {
  return Object.values(OrderStatus).includes(status);
}

/**
 * Verifica se um status de batch é válido
 */
export function isValidBatchStatus(status) {
  return Object.values(BatchStatus).includes(status);
}

/**
 * Verifica se um tipo de produto é válido
 */
export function isValidProductType(type) {
  return Object.values(ProductType).includes(type);
}

/**
 * Verifica se uma role de usuário é válida
 */
export function isValidUserRole(role) {
  return Object.values(UserRole).includes(role);
}

/**
 * Retorna o display format para um status
 */
export function formatOrderStatus(status) {
  const statusMap = {
    'idle': 'Inativo',
    'requesting': 'Solicitando',
    'offering': 'Ofertando',
    'partially_reserved': 'Parcialmente Reservado',
    'reserved': 'Reservado',
    'in_progress': 'Em Andamento',
    'awaiting_pickup': 'Aguardando Retirada',
    'picked_up': 'Retirado',
    'in_transit': 'Em Trânsito',
    'pending_confirmation': 'Pendente Confirmação',
    'completed': 'Concluído',
    'cancelled': 'Cancelado'
  };
  
  return statusMap[status] || status;
}

/**
 * Retorna o display format para um status de batch
 */
export function formatBatchStatus(status) {
  const statusMap = {
    [BatchStatus.PRODUCING]: 'Produzindo',
    [BatchStatus.READY]: 'Disponível',
    [BatchStatus.RESERVED]: 'Reservado',
    [BatchStatus.PICKED_UP]: 'Retirado',
    [BatchStatus.DELIVERED]: 'Entregue',
    [BatchStatus.CANCELLED]: 'Cancelado',
    [BatchStatus.EXPIRED]: 'Expirado'
  };
  
  return statusMap[status] || status;
}

/**
 * Retorna o display format para um tipo de produto
 */
export function formatProductType(type) {
  const typeMap = {
    [ProductType.MEAL]: 'Marmitas',
    [ProductType.INGREDIENT]: 'Insumos',
    [ProductType.CLOTHING]: 'Roupas',
    [ProductType.HYGIENE]: 'Higiene',
    [ProductType.CLEANING]: 'Limpeza',
    [ProductType.SCHOOL_SUPPLIES]: 'Material Escolar',
    [ProductType.BABY_ITEMS]: 'Itens de Bebê',
    [ProductType.PET_SUPPLIES]: 'Itens para Pets'
  };
  
  return typeMap[type] || type;
}

/**
 * Retorna a classe CSS para um status de order
 */
export function getOrderStatusColor(status) {
  const colorMap = {
    'idle': 'bg-gray-100 text-gray-800',
    'requesting': 'bg-red-100 text-red-800',
    'offering': 'bg-yellow-100 text-yellow-800',
    'partially_reserved': 'bg-yellow-100 text-yellow-800',
    'reserved': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-orange-100 text-orange-800',
    'awaiting_pickup': 'bg-indigo-100 text-indigo-800',
    'picked_up': 'bg-cyan-100 text-cyan-800',
    'in_transit': 'bg-teal-100 text-teal-800',
    'pending_confirmation': 'bg-pink-100 text-pink-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Retorna a classe CSS para um status de batch
 */
export function getBatchStatusColor(status) {
  const colorMap = {
    [BatchStatus.PRODUCING]: 'bg-yellow-100 text-yellow-800',
    [BatchStatus.READY]: 'bg-green-100 text-green-800',
    [BatchStatus.RESERVED]: 'bg-purple-100 text-purple-800',
    [BatchStatus.PICKED_UP]: 'bg-blue-100 text-blue-800',
    [BatchStatus.DELIVERED]: 'bg-gray-100 text-gray-800',
    [BatchStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [BatchStatus.EXPIRED]: 'bg-orange-100 text-orange-800'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}
