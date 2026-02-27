// Generic interfaces for any product type system
// These interfaces define the contract for any domain-specific implementation

/**
 * Base product interface - can be meals, ingredients, clothing, medicine, etc.
 */
export class ProductInterface {
  constructor(config) {
    this.productType = config.productType;
    this.productName = config.productName;
    this.unitLabel = config.unitLabel || 'unidades';
    this.emoji = config.emoji || '📦';
    this.colorScheme = config.colorScheme || 'blue';
  }

  // Get display name for product
  getDisplayName() {
    return this.productName;
  }

  // Get unit label (e.g., "marmitas", "kg", "unidades")
  getUnitLabel() {
    return this.unitLabel;
  }

  // Get emoji for UI
  getEmoji() {
    return this.emoji;
  }

  // Get color scheme for UI components
  getColorScheme() {
    return this.colorScheme;
  }

  // Format quantity display
  formatQuantity(quantity) {
    return `${quantity} ${this.getUnitLabel()}`;
  }

  // Get status labels for this product type
  getStatusLabels() {
    return {
      REQUESTING: 'Solicitando',
      RESERVED: 'Reservado',
      IN_PROGRESS: 'Em Andamento',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
      EXPIRED: 'Expirado',
      PRODUCING: 'Em Produção',
      READY: 'Disponível',
      PICKED_UP: 'Retirado',
      DELIVERED: 'Entregue'
    };
  }
}

/**
 * Role interface - defines user roles and their permissions
 */
export class RoleInterface {
  constructor(config) {
    this.roleName = config.roleName;
    this.displayName = config.displayName;
    this.permissions = config.permissions || [];
    this.dashboardComponent = config.dashboardComponent;
  }

  can(permission) {
    return this.permissions.includes(permission);
  }

  getDisplayName() {
    return this.displayName;
  }
}

/**
 * Domain configuration - ties together product types and roles for a specific domain
 */
export class DomainConfig {
  constructor(config) {
    this.domainName = config.domainName;
    this.displayName = config.displayName;
    this.products = config.products || {};
    this.roles = config.roles || {};
  }

  getProduct(productType) {
    return this.products[productType];
  }

  getRole(roleName) {
    return this.roles[roleName];
  }

  getAllProducts() {
    return Object.values(this.products);
  }

  getAllRoles() {
    return Object.values(this.roles);
  }
}

// Meal-specific implementation
export const MealProduct = new ProductInterface({
  productType: 'MEAL',
  productName: 'Marmita',
  unitLabel: 'marmitas',
  emoji: '🍱',
  colorScheme: 'orange'
});

// Ingredient-specific implementation
export const IngredientProduct = new ProductInterface({
  productType: 'INGREDIENT',
  productName: 'Ingrediente',
  unitLabel: 'unidades',
  emoji: '🥘',
  colorScheme: 'green'
});

// Clothing-specific implementation
export const ClothingProduct = new ProductInterface({
  productType: 'CLOTHING',
  productName: 'Roupa',
  unitLabel: 'peças',
  emoji: '👕',
  colorScheme: 'purple'
});

// Medicine-specific implementation
export const MedicineProduct = new ProductInterface({
  productType: 'MEDICINE',
  productName: 'Medicamento',
  unitLabel: 'unidades',
  emoji: '💊',
  colorScheme: 'red'
});

// Role definitions for food domain
export const ProviderRole = new RoleInterface({
  roleName: 'provider',
  displayName: 'Fornecedor',
  permissions: ['create_batches', 'manage_own_batches', 'view_deliveries'],
  dashboardComponent: 'ProviderDashboard'
});

export const VolunteerRole = new RoleInterface({
  roleName: 'volunteer',
  displayName: 'Voluntário',
  permissions: ['reserve_deliveries', 'manage_own_deliveries', 'view_requests'],
  dashboardComponent: 'VolunteerDashboard'
});

export const ShelterRole = new RoleInterface({
  roleName: 'shelter',
  displayName: 'Abrigo',
  permissions: ['receive_deliveries', 'confirm_deliveries', 'view_own_deliveries'],
  dashboardComponent: 'ShelterDashboard'
});

export const AdminRole = new RoleInterface({
  roleName: 'admin',
  displayName: 'Administrador',
  permissions: ['manage_all', 'approve_locations', 'manage_users'],
  dashboardComponent: 'AdminDashboard'
});

// Food domain configuration
export const FoodDomainConfig = new DomainConfig({
  domainName: 'food',
  displayName: 'Sistema de Distribuição de Alimentos',
  products: {
    MEAL: MealProduct,
    INGREDIENT: IngredientProduct
  },
  roles: {
    provider: ProviderRole,
    volunteer: VolunteerRole,
    shelter: ShelterRole,
    admin: AdminRole
  }
});

// Utility functions
export const getProductInterface = (productType) => {
  return FoodDomainConfig.getProduct(productType) || MealProduct; // fallback
};

export const getRoleInterface = (roleName) => {
  return FoodDomainConfig.getRole(roleName);
};

export const getCurrentDomain = () => {
  return FoodDomainConfig;
};

// Export default domain for easy access
export default FoodDomainConfig;
