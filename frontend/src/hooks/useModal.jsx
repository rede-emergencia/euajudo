import { useState } from 'react';

/**
 * Hook customizado para gerenciar modais de forma simples e reutilizável
 * 
 * @example
 * // Uso básico
 * const { showSuccess, showError, showConfirm, ModalComponent } = useModal();
 * 
 * // Mostrar sucesso
 * showSuccess('Operação concluída!', 'Os dados foram salvos com sucesso.');
 * 
 * // Mostrar erro
 * showError('Erro!', 'Não foi possível salvar os dados.');
 * 
 * // Confirmar ação
 * showConfirm(
 *   'Confirmar exclusão',
 *   'Tem certeza que deseja excluir este item?',
 *   () => handleDelete()
 * );
 * 
 * // Renderizar no componente
 * return (
 *   <div>
 *     {ModalComponent}
 *     <button onClick={() => showSuccess('Teste', 'Mensagem de teste')}>
 *       Testar Modal
 *     </button>
 *   </div>
 * );
 */
const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    variant: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancelar',
    onConfirm: null,
    showCancel: false,
    size: 'md'
  });

  /**
   * Fecha o modal
   */
  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  /**
   * Abre um modal genérico
   */
  const openModal = (config) => {
    setModalState({
      isOpen: true,
      variant: config.variant || 'info',
      title: config.title || '',
      message: config.message || '',
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Cancelar',
      onConfirm: config.onConfirm || null,
      showCancel: config.showCancel || false,
      size: config.size || 'md'
    });
  };

  /**
   * Mostra modal de sucesso
   */
  const showSuccess = (title, message, confirmText = 'OK') => {
    openModal({
      variant: 'success',
      title,
      message,
      confirmText,
      showCancel: false
    });
  };

  /**
   * Mostra modal de erro
   */
  const showError = (title, message, confirmText = 'OK') => {
    openModal({
      variant: 'error',
      title,
      message,
      confirmText,
      showCancel: false
    });
  };

  /**
   * Mostra modal de aviso
   */
  const showWarning = (title, message, confirmText = 'OK') => {
    openModal({
      variant: 'warning',
      title,
      message,
      confirmText,
      showCancel: false
    });
  };

  /**
   * Mostra modal de informação
   */
  const showInfo = (title, message, confirmText = 'OK') => {
    openModal({
      variant: 'info',
      title,
      message,
      confirmText,
      showCancel: false
    });
  };

  /**
   * Mostra modal de confirmação com callback
   */
  const showConfirm = (
    title, 
    message, 
    onConfirm, 
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
  ) => {
    openModal({
      variant: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      showCancel: true
    });
  };

  // Componente Modal já configurado
  const ModalComponent = modalState.isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div 
        className={`bg-white rounded-lg shadow-xl ${
          modalState.size === 'sm' ? 'max-w-sm' : 
          modalState.size === 'lg' ? 'max-w-lg' : 
          'max-w-md'
        } w-full transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-6 border-b ${
          modalState.variant === 'success' ? 'border-green-200' :
          modalState.variant === 'error' ? 'border-red-200' :
          modalState.variant === 'warning' ? 'border-yellow-200' :
          'border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              modalState.variant === 'success' ? 'bg-green-50' :
              modalState.variant === 'error' ? 'bg-red-50' :
              modalState.variant === 'warning' ? 'bg-yellow-50' :
              'bg-blue-50'
            }`}>
              {modalState.variant === 'success' && (
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {modalState.variant === 'error' && (
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {modalState.variant === 'warning' && (
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {(modalState.variant === 'info' || modalState.variant === 'confirm') && (
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className={`text-lg font-semibold ${
              modalState.variant === 'success' ? 'text-green-900' :
              modalState.variant === 'error' ? 'text-red-900' :
              modalState.variant === 'warning' ? 'text-yellow-900' :
              'text-blue-900'
            }`}>
              {modalState.title}
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-line">
            {modalState.message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          {modalState.showCancel && (
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {modalState.cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (modalState.onConfirm) {
                modalState.onConfirm();
              }
              closeModal();
            }}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              modalState.variant === 'success' ? 'bg-green-600 hover:bg-green-700' :
              modalState.variant === 'error' ? 'bg-red-600 hover:bg-red-700' :
              modalState.variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
              'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {modalState.confirmText}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return {
    // Funções de controle
    openModal,
    closeModal,
    
    // Atalhos para variantes
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    
    // Componente renderizável
    ModalComponent,
    
    // Estado (para casos avançados)
    isOpen: modalState.isOpen
  };
};

export default useModal;
