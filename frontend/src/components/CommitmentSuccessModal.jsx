import { X, CheckCircle, Copy, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function CommitmentSuccessModal({ 
  isOpen, 
  onClose, 
  delivery 
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !delivery) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(delivery.pickup_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        {/* Header com ícone de sucesso */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-white/20 rounded-full p-3 mb-3">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">Compromisso Confirmado!</h2>
            <p className="text-green-100 mt-2">
              Você se comprometeu com sucesso
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {/* Informações da entrega */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Local de entrega</p>
                <p className="font-semibold text-gray-900">
                  {delivery.location?.name || 'Local não especificado'}
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-600">Quantidade</p>
              <p className="font-semibold text-gray-900">
                {delivery.quantity} {delivery.product_type === 'meal' ? 'marmitas' : 'itens'}
              </p>
            </div>
          </div>

          {/* Código de retirada */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Código de Retirada
            </p>
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-300">
              <span className="text-3xl font-bold text-yellow-700 tracking-wider">
                {delivery.pickup_code}
              </span>
              <button
                onClick={copyCode}
                className="ml-3 flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Copy size={16} />
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Use este código ao retirar os itens
            </p>
          </div>

          {/* Próximos passos */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">
              📋 Próximos Passos
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Vá até o local de retirada</li>
              <li>Apresente o código de retirada</li>
              <li>Retire os itens e confirme</li>
              <li>Entregue no destino</li>
            </ol>
          </div>

          {/* Botão de ação */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Acompanhar em "Ações"
          </button>
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
