/**
 * Hook React para Cancelamento Genérico
 * 
 * Facilita o uso do CancelService em componentes React.
 */

import { useState } from 'react';
import { cancelService } from '../services/cancelService';

export const useCancel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cancela uma entidade com feedback de loading e erro
   * @param {string} entityType - Tipo da entidade
   * @param {number} entityId - ID da entidade
   * @param {Object} options - Opções adicionais
   * @returns {Promise} Resultado da operação
   */
  const cancelEntity = async (entityType, entityId, options = {}) => {
    const { 
      reason = null,
      onSuccess = null,
      onError = null,
      showConfirm = false,
      confirmMessage = 'Tem certeza que deseja cancelar?'
    } = options;

    // Mostrar confirmação se solicitado
    if (showConfirm) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        return { success: false, message: 'Operação cancelada pelo usuário' };
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await cancelService.cancelEntity(entityType, entityId, reason);
      
      if (result.success) {
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        setError(result.message);
        if (onError) {
          onError(result);
        }
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao cancelar';
      setError(errorMessage);
      
      const errorResult = { success: false, message: errorMessage };
      
      if (onError) {
        onError(errorResult);
      }
      
      return errorResult;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancela delivery (wrapper específico)
   */
  const cancelDelivery = async (deliveryId, options = {}) => {
    return cancelEntity('delivery', deliveryId, {
      confirmMessage: 'Tem certeza que deseja cancelar esta entrega?',
      ...options
    });
  };

  /**
   * Cancela batch (wrapper específico)
   */
  const cancelBatch = async (batchId, options = {}) => {
    return cancelEntity('batch', batchId, {
      confirmMessage: 'Tem certeza que deseja cancelar este lote?',
      ...options
    });
  };

  /**
   * Cancela resource request (wrapper específico)
   */
  const cancelResourceRequest = async (requestId, options = {}) => {
    return cancelEntity('resource_request', requestId, {
      confirmMessage: 'Tem certeza que deseja cancelar esta solicitação?',
      ...options
    });
  };

  /**
   * Cancela resource reservation (wrapper específico)
   */
  const cancelResourceReservation = async (reservationId, options = {}) => {
    return cancelEntity('resource_reservation', reservationId, {
      confirmMessage: 'Tem certeza que deseja cancelar esta reserva?',
      ...options
    });
  };

  /**
   * Limpa estados de erro
   */
  const clearError = () => {
    setError(null);
  };

  return {
    // Estado
    loading,
    error,
    
    // Ações genéricas
    cancelEntity,
    
    // Ações específicas (wrappers)
    cancelDelivery,
    cancelBatch,
    cancelResourceRequest,
    cancelResourceReservation,
    
    // Utilitários
    clearError
  };
};

export default useCancel;
