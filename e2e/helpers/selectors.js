/**
 * Seletores centralizados para evitar duplicação
 * Usa data-testid quando disponível, fallback para outros seletores
 */

export const SELECTORS = {
  // Auth
  auth: {
    loginButton: '[data-testid="login-button"]',
    loginModal: '[data-testid="login-modal"]',
    emailInput: '[data-testid="login-email"]',
    passwordInput: '[data-testid="login-password"]',
    submitButton: '[data-testid="login-submit"]',
    registerButton: '[data-testid="register-button"]',
    logoutButton: '[data-testid="logout-button"]',
  },
  
  // Provider Dashboard
  provider: {
    dashboard: '[data-testid="provider-dashboard"]',
    createResourceRequestButton: '[data-testid="create-resource-request"]',
    createBatchButton: '[data-testid="create-batch"]',
    resourceRequestList: '[data-testid="resource-request-list"]',
    batchList: '[data-testid="batch-list"]',
  },
  
  // Volunteer Dashboard
  volunteer: {
    dashboard: '[data-testid="volunteer-dashboard"]',
    availableRequests: '[data-testid="available-requests"]',
    availableBatches: '[data-testid="available-batches"]',
    myReservations: '[data-testid="my-reservations"]',
    myDeliveries: '[data-testid="my-deliveries"]',
  },
  
  // Shelter Dashboard
  shelter: {
    dashboard: '[data-testid="shelter-dashboard"]',
    receivedBatches: '[data-testid="received-batches"]',
    pendingDeliveries: '[data-testid="pending-deliveries"]',
  },
  
  // Forms
  forms: {
    resourceRequest: {
      quantityInput: '[data-testid="resource-quantity"]',
      receivingTimeInput: '[data-testid="receiving-time"]',
      itemNameInput: '[data-testid="item-name"]',
      itemQuantityInput: '[data-testid="item-quantity"]',
      itemUnitInput: '[data-testid="item-unit"]',
      addItemButton: '[data-testid="add-item"]',
      submitButton: '[data-testid="submit-resource-request"]',
    },
    batch: {
      productTypeSelect: '[data-testid="product-type"]',
      quantityInput: '[data-testid="batch-quantity"]',
      descriptionInput: '[data-testid="batch-description"]',
      donatedIngredientsCheckbox: '[data-testid="donated-ingredients"]',
      submitButton: '[data-testid="submit-batch"]',
    },
    delivery: {
      locationSelect: '[data-testid="delivery-location"]',
      quantityInput: '[data-testid="delivery-quantity"]',
      submitButton: '[data-testid="submit-delivery"]',
    }
  },
  
  // Common
  common: {
    modal: '[data-testid="modal"]',
    confirmButton: '[data-testid="confirm-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    closeButton: '[data-testid="close-button"]',
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
  }
};

/**
 * Helper para criar seletores dinâmicos
 */
export function getTestId(id) {
  return `[data-testid="${id}"]`;
}

/**
 * Helper para selecionar por ID dinâmico
 */
export function getResourceRequestCard(id) {
  return `[data-testid="resource-request-${id}"]`;
}

export function getBatchCard(id) {
  return `[data-testid="batch-${id}"]`;
}

export function getDeliveryCard(id) {
  return `[data-testid="delivery-${id}"]`;
}
