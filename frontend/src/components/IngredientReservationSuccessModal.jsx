import { X, CheckCircle, Clock, Package } from 'lucide-react';
import { useState } from 'react';

export default function IngredientReservationSuccessModal({ 
  isOpen, 
  onClose, 
  reservation 
}) {
  if (!isOpen || !reservation) return null;

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
            <h2 className="text-2xl font-bold">
              Reserva Confirmada!
            </h2>
            <p className="text-green-100 mt-2">
              Você comprometeu os ingredientes com sucesso
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {/* Informações da reserva */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Package className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Fornecedor</p>
                <p className="font-semibold text-gray-900">
                  {reservation.provider?.name || 'Fornecedor não especificado'}
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-600">Previsão de Entrega</p>
              <p className="font-semibold text-gray-900">
                {new Date(reservation.estimated_delivery).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-600">Itens Reservados</p>
              <div className="mt-2 space-y-1">
                {reservation.items?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-semibold text-gray-900">
                      {item.quantity}{item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status da reserva */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">
              📋 Status da Reserva
            </p>
            <div className="text-sm text-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sua reserva foi confirmada</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Prepare os ingredientes para entrega</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Entregue na data prevista</span>
              </div>
            </div>
          </div>

          {/* Próximos passos */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-900 mb-2">
              ⏰ Próximos Passos
            </p>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Prepare os ingredientes reservados</li>
              <li>Entregue na data prevista</li>
              <li>Confirme a entrega no sistema</li>
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
