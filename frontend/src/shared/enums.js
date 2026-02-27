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
