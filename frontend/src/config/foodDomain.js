import { DomainConfig, ProductInterface, RoleInterface } from '../lib/interfaces';

// Food domain specific configuration
export const FoodDomain = new DomainConfig({
  domainName: 'food',
  displayName: 'Sistema de Distribuição de Alimentos',
  
  products: {
    MEAL: new ProductInterface({
      productType: 'MEAL',
      productName: 'Marmita',
      unitLabel: 'marmitas',
      emoji: '🍱',
      colorScheme: 'orange'
    }),
    
    INGREDIENT: new ProductInterface({
      productType: 'INGREDIENT',
      productName: 'Ingrediente',
      unitLabel: 'unidades',
      emoji: '🥘',
      colorScheme: 'green'
    })
  },
  
  roles: {
    provider: new RoleInterface({
      roleName: 'provider',
      displayName: 'Fornecedor',
      permissions: ['create_batches', 'manage_own_batches', 'view_deliveries'],
      dashboardComponent: 'ProviderDashboard'
    }),
    
    volunteer: new RoleInterface({
      roleName: 'volunteer',
      displayName: 'Voluntário',
      permissions: ['reserve_deliveries', 'manage_own_deliveries', 'view_requests'],
      dashboardComponent: 'VolunteerDashboard'
    }),
    
    shelter: new RoleInterface({
      roleName: 'shelter',
      displayName: 'Abrigo',
      permissions: ['receive_deliveries', 'confirm_deliveries', 'view_own_deliveries'],
      dashboardComponent: 'ShelterDashboard'
    }),
    
    admin: new RoleInterface({
      roleName: 'admin',
      displayName: 'Administrador',
      permissions: ['manage_all', 'approve_locations', 'manage_users'],
      dashboardComponent: 'AdminDashboard'
    })
  }
});

// Example of how to configure a different domain (e.g., clothing)
export const ClothingDomain = new DomainConfig({
  domainName: 'clothing',
  displayName: 'Sistema de Distribuição de Roupas',
  
  products: {
    CLOTHING: new ProductInterface({
      productType: 'CLOTHING',
      productName: 'Roupa',
      unitLabel: 'peças',
      emoji: '👕',
      colorScheme: 'purple'
    })
  },
  
  roles: {
    donor: new RoleInterface({
      roleName: 'donor',
      displayName: 'Doador',
      permissions: ['create_batches', 'manage_own_batches'],
      dashboardComponent: 'DonorDashboard'
    }),
    
    volunteer: new RoleInterface({
      roleName: 'volunteer',
      displayName: 'Voluntário',
      permissions: ['reserve_deliveries', 'manage_own_deliveries'],
      dashboardComponent: 'VolunteerDashboard'
    }),
    
    shelter: new RoleInterface({
      roleName: 'shelter',
      displayName: 'Abrigo',
      permissions: ['receive_deliveries', 'confirm_deliveries'],
      dashboardComponent: 'ShelterDashboard'
    }),
    
    admin: new RoleInterface({
      roleName: 'admin',
      displayName: 'Administrador',
      permissions: ['manage_all', 'approve_locations', 'manage_users'],
      dashboardComponent: 'AdminDashboard'
    })
  }
});

// Domain factory - allows switching between domains
export class DomainFactory {
  static getDomain(domainName) {
    switch (domainName) {
      case 'food':
        return FoodDomain;
      case 'clothing':
        return ClothingDomain;
      default:
        return FoodDomain; // Default to food domain
    }
  }
  
  static getAvailableDomains() {
    return [
      { name: 'food', displayName: 'Alimentos' },
      { name: 'clothing', displayName: 'Roupas' }
    ];
  }
}

// Configuration for current environment
export const CURRENT_DOMAIN = process.env.REACT_APP_DOMAIN || 'food';
export const currentDomain = DomainFactory.getDomain(CURRENT_DOMAIN);

export default FoodDomain;
