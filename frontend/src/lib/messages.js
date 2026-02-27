import { getProductInterface } from './interfaces';

/**
 * Generic message system that adapts to any product type
 * Eliminates hardcoded strings like "marmita", "insumo", etc.
 */

export class MessageFormatter {
  constructor(productType = 'MEAL') {
    this.product = getProductInterface(productType);
  }

  // Batch/lot related messages
  getBatchCreatedMessage() {
    return `✅ ${this.product.getDisplayName()} criado com sucesso!`;
  }

  getBatchCancelledMessage() {
    return `✅ ${this.product.getDisplayName()} cancelado com sucesso!`;
  }

  getBatchReadyMessage() {
    return `✅ ${this.product.getDisplayName()} marcado como disponível!`;
  }

  getBatchExpiredMessage() {
    return `⚠️ ${this.product.getDisplayName()} expirou!`;
  }

  // Delivery related messages
  getDeliveryReservedMessage() {
    return `✅ Entrega de ${this.product.getUnitLabel()} reservada!`;
  }

  getDeliveryPickupConfirmedMessage() {
    return `✅ Retirada confirmada! Agora você pode iniciar a entrega.`;
  }

  getDeliveryConfirmedMessage() {
    return `✅ Entrega confirmada com sucesso! Obrigado por sua contribuição!`;
  }

  getDeliveryCancelledMessage() {
    return `✅ Entrega cancelada com sucesso!`;
  }

  // Request related messages
  getRequestCreatedMessage() {
    return `✅ Pedido de ${this.product.getUnitLabel()} criado com sucesso!`;
  }

  getRequestCancelledMessage() {
    return `✅ Pedido cancelado com sucesso!`;
  }

  // Reservation related messages
  getReservationCreatedMessage() {
    return `✅ Reserva criada com sucesso!`;
  }

  getReservationCancelledMessage() {
    return `✅ Reserva cancelada com sucesso!`;
  }

  getReservationDeliveredMessage() {
    return `✅ Entrega confirmada! Obrigado por sua contribuição!`;
  }

  // Form validation messages
  getFillAllFieldsMessage() {
    return 'Por favor, preencha todos os campos obrigatórios.';
  }

  getInvalidCodeMessage() {
    return '❌ Código inválido. Digite o código de 6 dígitos.';
  }

  // Status messages
  getStatusMessage(status) {
    const messages = {
      'REQUESTING': '📋 Solicitando recursos...',
      'RESERVED': '📦 Recursos reservados',
      'IN_PROGRESS': '🔄 Em andamento',
      'COMPLETED': '✅ Concluído',
      'CANCELLED': '❌ Cancelado',
      'EXPIRED': '⏰ Expirado',
      'PRODUCING': '👨‍🍳 Em produção',
      'READY': '✅ Disponível para retirada',
      'PICKED_UP': '🚚 Em rota de entrega',
      'DELIVERED': '🎉 Entregue com sucesso'
    };
    return messages[status] || status;
  }

  // Action messages
  getPickupInstructionsMessage(providerName, address) {
    return `Vá ao ${this.product.getDisplayName()} <strong>${providerName}</strong> e retire os itens.\n📍 ${address}`;
  }

  getDeliveryInstructionsMessage() {
    return `Entregue no destino e confirme com o código do local.`;
  }

  getWaitingVolunteerMessage() {
    return `Aguardando voluntário retirar os ${this.product.getUnitLabel()}...`;
  }

  getVolunteerOnTheWayMessage(volunteerName, quantity) {
    return `Voluntário <strong>${volunteerName}</strong> está entregando ${quantity} ${this.product.getUnitLabel()}.`;
  }

  // Code messages
  getPickupCodeMessage() {
    return `Código de Retirada`;
  }

  getDeliveryCodeMessage() {
    return `Código de Entrega`;
  }

  getPickupCodeInstructions() {
    return `Forneça este código ao voluntário para ele confirmar a retirada:`;
  }

  getDeliveryCodeInstructions() {
    return `Forneça este código ao voluntário para confirmar a entrega:`;
  }

  // Modal titles
  getCreateBatchModalTitle() {
    return `Novo ${this.product.getDisplayName()}`;
  }

  getConfirmPickupModalTitle() {
    return `📦 Confirmar Retirada`;
  }

  getConfirmDeliveryModalTitle() {
    return `📍 Confirmar Entrega`;
  }

  getCancelDeliveryModalTitle() {
    return `❌ Cancelar Entrega`;
  }

  // Empty state messages
  getNoBatchesMessage() {
    return `Nenhum ${this.product.getDisplayName()} criado ainda.`;
  }

  getNoRequestsMessage() {
    return `Nenhum pedido de ${this.product.getUnitLabel()} encontrado.`;
  }

  getNoReservationsMessage() {
    return 'Nenhuma reserva encontrada.';
  }

  getNoDeliveriesMessage() {
    return 'Nenhuma entrega encontrada.';
  }

  // Button labels
  getCreateBatchButtonLabel() {
    return `+ Novo ${this.product.getDisplayName()}`;
  }

  getReserveDeliveryButtonLabel() {
    return `Reservar para Entrega`;
  }

  getConfirmPickupButtonLabel() {
    return '✅ Confirmar Retirada';
  }

  getConfirmDeliveryButtonLabel() {
    return '✅ Confirmar Entrega';
  }

  getCancelButtonLabel() {
    return '❌ Cancelar';
  }

  // Quantity formatting
  formatQuantity(quantity) {
    return this.product.formatQuantity(quantity);
  }

  // Product emoji
  getProductEmoji() {
    return this.product.getEmoji();
  }
}

// Factory function to get message formatter for product type
export const getMessageFormatter = (productType = 'MEAL') => {
  return new MessageFormatter(productType);
};

// Default formatter for backward compatibility
export const defaultFormatter = new MessageFormatter('MEAL');

// Export common messages that don't depend on product type
export const COMMON_MESSAGES = {
  LOADING: 'Carregando...',
  ERROR_GENERIC: 'Ocorreu um erro. Tente novamente.',
  SUCCESS_GENERIC: 'Operação realizada com sucesso!',
  CONFIRM_ACTION: 'Tem certeza que deseja realizar esta ação?',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Você não tem permissão para realizar esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro no servidor. Tente novamente mais tarde.'
};

export default MessageFormatter;
