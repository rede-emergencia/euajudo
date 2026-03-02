import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Modal reutilizável com variantes de design
 * 
 * Variantes disponíveis:
 * - success: Verde, para confirmações de sucesso
 * - error: Vermelho, para erros
 * - warning: Amarelo, para avisos
 * - info: Azul, para informações
 * - confirm: Azul, para confirmações com ações
 * 
 * @example
 * // Modal de sucesso simples
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   variant="success"
 *   title="Sucesso!"
 *   message="Operação concluída com sucesso."
 * />
 * 
 * @example
 * // Modal de confirmação com ações
 * <Modal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   variant="confirm"
 *   title="Confirmar ação"
 *   message="Tem certeza que deseja continuar?"
 *   confirmText="Sim, continuar"
 *   cancelText="Cancelar"
 *   onConfirm={handleConfirm}
 * />
 */
const Modal = ({
  isOpen,
  onClose,
  variant = 'info', // success, error, warning, info, confirm
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancelar',
  onConfirm,
  showCancel = false,
  children,
  size = 'md' // sm, md, lg
}) => {
  if (!isOpen) return null;

  // Configurações de variantes
  const variants = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      titleColor: 'text-green-900'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      titleColor: 'text-red-900'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      titleColor: 'text-yellow-900'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      titleColor: 'text-blue-900'
    },
    confirm: {
      icon: Info,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      titleColor: 'text-blue-900'
    }
  };

  const config = variants[variant];
  const Icon = config.icon;

  // Tamanhos
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div 
        className={`bg-white rounded-lg shadow-xl ${sizes[size]} w-full transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-6 border-b ${config.borderColor}`}>
          <div className="flex items-center gap-3">
            <div className={`${config.bgColor} p-2 rounded-full`}>
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <h3 className={`text-lg font-semibold ${config.titleColor}`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {message && (
            <p className="text-gray-700 whitespace-pre-line">
              {message}
            </p>
          )}
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          {(showCancel || variant === 'confirm') && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${config.buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
