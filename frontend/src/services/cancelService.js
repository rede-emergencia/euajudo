/**
 * Serviço Genérico de Cancelamento
 * 
 * Padroniza o cancelamento de qualquer tipo de entidade no frontend.
 */

class CancelService {
  constructor() {
    this.baseURL = '/api/cancel';
  }

  /**
   * Cancela uma entidade genérica
   * @param {string} entityType - Tipo da entidade (delivery, batch, resource_request, resource_reservation)
   * @param {number} entityId - ID da entidade
   * @param {string} reason - Motivo do cancelamento (opcional)
   * @returns {Promise} Resultado da operação
   */
  async cancelEntity(entityType, entityId, reason = null) {
    try {
      const token = localStorage.getItem('token');
      
      const requestBody = reason ? { reason } : {};
      
      const response = await fetch(`${this.baseURL}/${entityType}/${entityId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: result.message || 'Operação cancelada com sucesso',
          data: result
        };
      } else {
        let errorMessage = 'Erro desconhecido';
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || 'Erro desconhecido';
        } catch (parseError) {
          try {
            const errorText = await response.text();
            errorMessage = errorText || 'Erro desconhecido';
          } catch (textError) {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
        }
        return {
          success: false,
          message: errorMessage,
          status: response.status
        };
      }
    } catch (error) {
      console.error('Erro ao cancelar entidade:', error);
      return {
        success: false,
        message: error.message || 'Erro de conexão',
        error: error
      };
    }
  }

  /**
   * Cancela uma delivery (wrapper para compatibilidade)
   * @param {number} deliveryId - ID da delivery
   * @param {string} reason - Motivo do cancelamento
   * @returns {Promise} Resultado da operação
   */
  async cancelDelivery(deliveryId, reason = null) {
    return this.cancelEntity('delivery', deliveryId, reason);
  }

  /**
   * Cancela um batch (wrapper para compatibilidade)
   * @param {number} batchId - ID do batch
   * @param {string} reason - Motivo do cancelamento
   * @returns {Promise} Resultado da operação
   */
  async cancelBatch(batchId, reason = null) {
    return this.cancelEntity('batch', batchId, reason);
  }

  /**
   * Cancela uma resource request (wrapper para compatibilidade)
   * @param {number} requestId - ID da request
   * @param {string} reason - Motivo do cancelamento
   * @returns {Promise} Resultado da operação
   */
  async cancelResourceRequest(requestId, reason = null) {
    return this.cancelEntity('resource_request', requestId, reason);
  }

  /**
   * Cancela uma resource reservation (wrapper para compatibilidade)
   * @param {number} reservationId - ID da reservation
   * @param {string} reason - Motivo do cancelamento
   * @returns {Promise} Resultado da operação
   */
  async cancelResourceReservation(reservationId, reason = null) {
    return this.cancelEntity('resource_reservation', reservationId, reason);
  }

  /**
   * Obtém os tipos de entidades que podem ser canceladas
   * @returns {Promise} Lista de tipos canceláveis
   */
  async getCancellableTypes() {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${this.baseURL}/types`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          data: result.types
        };
      } else {
        return {
          success: false,
          message: 'Erro ao obter tipos canceláveis'
        };
      }
    } catch (error) {
      console.error('Erro ao obter tipos canceláveis:', error);
      return {
        success: false,
        message: error.message || 'Erro de conexão'
      };
    }
  }

  /**
   * Verifica se uma entidade pode ser cancelada baseado no status
   * @param {string} entityType - Tipo da entidade
   * @param {string} status - Status atual
   * @returns {Promise} Se pode ser cancelada
   */
  async canCancel(entityType, status) {
    try {
      const result = await this.getCancellableTypes();
      
      if (!result.success) {
        return false;
      }

      const typeConfig = result.data.find(type => type.type === entityType);
      
      if (!typeConfig) {
        return false;
      }

      return typeConfig.cancelable_statuses.includes(status);
    } catch (error) {
      console.error('Erro ao verificar se pode cancelar:', error);
      return false;
    }
  }
}

// Exportar instância singleton
export const cancelService = new CancelService();

// Exportar classe para testes ou uso personalizado
export default CancelService;
