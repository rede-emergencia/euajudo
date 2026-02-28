import { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Modal padrão para confirmação por código
 * 
 * Princípio: Quem DOA/ENTREGA confirma o código
 *            Quem RECEBE mostra o código
 * 
 * Uso em todos os fluxos de transferência:
 * - Retirada: Fornecedor (doa) confirma código do voluntário (recebe)
 * - Entrega: Voluntário (doa) confirma código do abrigo (recebe)
 */
export default function CodeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  codeLabel = "Código de Confirmação",
  codePlaceholder = "Digite o código de 6 dígitos",
  expectedCode,
  itemDetails,
  confirmButtonText = "Confirmar",
  cancelButtonText = "Cancelar",
  successMessage = "Código confirmado com sucesso!",
  errorMessage = "Código inválido. Tente novamente.",
  type = 'confirm', // 'confirm' = quem doa confirma | 'display' = quem recebe mostra
  canCancel = true, // Controla se pode cancelar baseado no estado da operação
  cancelReason = '' // Motivo pelo qual não pode cancelar (ex: "Produto já retirado")
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!code || code.length < 4) {
      setError('Digite um código válido');
      return;
    }

    // Se tem expectedCode, validar localmente primeiro
    if (expectedCode && code !== expectedCode) {
      setError(errorMessage);
      return;
    }

    setError('');
    onConfirm(code);
    setCode('');
  };

  const handleCopyCode = () => {
    if (expectedCode) {
      navigator.clipboard.writeText(expectedCode);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className={`p-6 rounded-t-2xl text-white relative ${
          type === 'confirm' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'
        }`}>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-white/20 rounded-full p-3 mb-3">
              {type === 'confirm' ? (
                <CheckCircle size={48} className="text-white" />
              ) : (
                <AlertCircle size={48} className="text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-white/80 mt-2 text-sm">
              {description}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Item Details */}
          {itemDetails && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              {Object.entries(itemDetails).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Code Input or Display */}
          {type === 'confirm' ? (
            // Modo CONFIRMAR: quem doa digita o código recebido
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {codeLabel}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder={codePlaceholder}
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-center text-xl font-bold tracking-widest uppercase focus:border-blue-500 focus:outline-none transition-colors"
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
            </div>
          ) : (
            // Modo MOSTRAR: quem recebe vê o código
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {codeLabel}
              </p>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-300">
                <span className="text-3xl font-bold text-yellow-700 tracking-wider">
                  {expectedCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="ml-3 flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {showCopied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Mostre este código para quem está entregando
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {canCancel ? (
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                {cancelButtonText}
              </button>
            ) : (
              <div className="flex-1 px-4 py-3 bg-gray-50 text-gray-500 font-medium rounded-lg border border-gray-200 text-center">
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle size={16} />
                  <span>Não pode cancelar</span>
                </div>
                {cancelReason && (
                  <p className="text-xs text-gray-400 mt-1">{cancelReason}</p>
                )}
              </div>
            )}
            {type === 'confirm' && (
              <button
                onClick={handleConfirm}
                disabled={!code || code.length < 4}
                className={`px-4 py-3 font-medium rounded-lg transition-all ${
                  canCancel 
                    ? 'flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white'
                    : 'w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white'
                }`}
              >
                {confirmButtonText}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
