/**
 * Shared enums from shared/enums.json (source of truth).
 * Do NOT define enum values here - always read from JSON.
 */
import enumsData from '@shared/enums.json';

export const OrderStatus = enumsData.OrderStatus;
export const BatchStatus = enumsData.BatchStatus;
export const DeliveryStatus = enumsData.DeliveryStatus;
export const ProductType = enumsData.ProductType;
export const OrderType = enumsData.OrderType;
export const UserRole = enumsData.UserRole;
export const displayNames = enumsData.displayNames;
export const colors = enumsData.colors;
export const mapIcons = enumsData.mapIcons;

export function display(enumName, value) {
  return enumsData.displayNames?.[enumName]?.[value] || value;
}

export function colorClass(enumName, value) {
  return enumsData.colors?.[enumName]?.[value] || 'bg-gray-100 text-gray-800';
}

export function getMapIconColor(role, status) {
  return enumsData.mapIcons?.[role]?.[status]?.color || '#6b7280';
}

/**
 * Retorna o display format para um tipo de produto no singular
 */
export function formatProductTypeSingular(type) {
  const typeMap = {
    'meal': 'marmita',
    'ingredient': 'insumo', 
    'clothing': 'roupa',
    'medicine': 'medicamento',
    'hygiene': 'item de higiene',
    'cleaning': 'item de limpeza',
    'school_supplies': 'material escolar',
    'baby_items': 'item de bebê',
    'pet_supplies': 'item para pet',
    'generic': 'item'
  };
  
  return typeMap[type] || type;
}

/**
 * Retorna o nome formatado do produto com quantidade (singular/plural automático)
 */
export function formatProductWithQuantity(type, quantity) {
  if (quantity === 1) {
    return formatProductTypeSingular(type);
  }
  // Usa os dados do JSON para plural (já existem em displayNames.ProductType)
  return enumsData.displayNames?.ProductType?.[type]?.toLowerCase() || type;
}
