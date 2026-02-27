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
  RESERVED: 'reserved',
  IN_PROGRESS: 'in_progress',
  AWAITING_PICKUP: 'awaiting_pickup',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  PENDING_CONFIRMATION: 'pending_confirmation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

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
} as const;

export type BatchStatusType = typeof BatchStatus[keyof typeof BatchStatus];

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
} as const;

export type ProductTypeType = typeof ProductType[keyof typeof ProductType];

// ============================================================================
// USER ROLES ENUM
// ============================================================================
export const UserRole = {
  PROVIDER: 'provider',
  VOLUNTEER: 'volunteer', 
  SHELTER: 'shelter',
  ADMIN: 'admin'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se um status é válido
 */
export function isValidOrderStatus(status: string): status is OrderStatusType {
  return Object.values(OrderStatus).includes(status as OrderStatusType);
}

/**
 * Verifica se um status de batch é válido
 */
export function isValidBatchStatus(status: string): status is BatchStatusType {
  return Object.values(BatchStatus).includes(status as BatchStatusType);
}

/**
 * Verifica se um tipo de produto é válido
 */
export function isValidProductType(type: string): type is ProductTypeType {
  return Object.values(ProductType).includes(type as ProductTypeType);
}

/**
 * Verifica se uma role de usuário é válida
 */
export function isValidUserRole(role: string): role is UserRoleType {
  return Object.values(UserRole).includes(role as UserRoleType);
}

/**
 * Retorna o display format para um status
 */
export function formatOrderStatus(status: OrderStatusType): string {
  const statusMap = {
    [OrderStatus.IDLE]: 'Inativo',
    [OrderStatus.REQUESTING]: 'Solicitando',
    [OrderStatus.OFFERING]: 'Ofertando',
    [OrderStatus.RESERVED]: 'Reservado',
    [OrderStatus.IN_PROGRESS]: 'Em Andamento',
    [OrderStatus.AWAITING_PICKUP]: 'Aguardando Retirada',
    [OrderStatus.PICKED_UP]: 'Retirado',
    [OrderStatus.IN_TRANSIT]: 'Em Trânsito',
    [OrderStatus.PENDING_CONFIRMATION]: 'Pendente Confirmação',
    [OrderStatus.COMPLETED]: 'Concluído',
    [OrderStatus.CANCELLED]: 'Cancelado'
  };
  
  return statusMap[status] || status;
}

/**
 * Retorna o display format para um status de batch
 */
export function formatBatchStatus(status: BatchStatusType): string {
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
export function formatProductType(type: ProductTypeType): string {
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
export function getOrderStatusColor(status: OrderStatusType): string {
  const colorMap = {
    [OrderStatus.IDLE]: 'bg-gray-100 text-gray-800',
    [OrderStatus.REQUESTING]: 'bg-blue-100 text-blue-800',
    [OrderStatus.OFFERING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.RESERVED]: 'bg-purple-100 text-purple-800',
    [OrderStatus.IN_PROGRESS]: 'bg-orange-100 text-orange-800',
    [OrderStatus.AWAITING_PICKUP]: 'bg-indigo-100 text-indigo-800',
    [OrderStatus.PICKED_UP]: 'bg-cyan-100 text-cyan-800',
    [OrderStatus.IN_TRANSIT]: 'bg-teal-100 text-teal-800',
    [OrderStatus.PENDING_CONFIRMATION]: 'bg-pink-100 text-pink-800',
    [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Retorna a classe CSS para um status de batch
 */
export function getBatchStatusColor(status: BatchStatusType): string {
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
