import React, { useState, useEffect } from 'react';
import { X, Check, MapPin } from 'lucide-react';

const DonationCommitmentModal = ({ 
  isOpen, 
  onClose, 
  shelter,
  donationRequests,
  categories,
  onCommit 
}) => {
  const [step, setStep] = useState('info'); // 'info', 'select', 'confirm', 'success'
  const [selectedItems, setSelectedItems] = useState({});
  const [commitmentCode, setCommitmentCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('info');
      setSelectedItems({});
      setCommitmentCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const units = {
    'agua': 'L',
    'alimentos': 'kg',
    'refeicoes_prontas': 'und',
    'higiene': 'und',
    'roupas': 'und',
    'medicamentos': 'und'
  };

  // Mapeamento de nomes de campos para português
  const metadataLabels = {
    'tipo_alimento': 'Tipo',
    'tipo': 'Tipo',
    'tamanho': 'Tamanho',
    'genero': 'Gênero',
    'measurement_unit': 'Unidade',
    'unidade': 'Unidade',
    'descricao': 'Descrição',
    'nome_medicamento': 'Medicamento',
    'tipo_medicamento': 'Tipo'
  };

  const formatMetadata = (metadata) => {
    return Object.entries(metadata).map(([key, value]) => ({
      key,
      label: metadataLabels[key] || key.replace(/_/g, ' '),
      value
    }));
  };

  const items = donationRequests.map(request => {
    const category = categories.find(c => c.id === request.category_id);
    const metadata = request.metadata_cache || {};
    return {
      id: request.id,
      name: category?.display_name || 'Item',
      needed: request.quantity_requested - (request.quantity_received || 0),
      unit: units[category?.name] || 'und',
      metadata: formatMetadata(metadata),
      request
    };
  }).filter(i => i.needed > 0);

  const toggleItem = (itemId) => {
    setSelectedItems(prev => {
      const item = items.find(i => i.id === itemId);
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { qty: item.needed, max: item.needed } };
    });
  };

  const changeQty = (itemId, val) => {
    const item = items.find(i => i.id === itemId);
    const qty = Math.max(0, Math.min(parseInt(val) || 0, item.needed));
    setSelectedItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], qty } }));
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const data = Object.entries(selectedItems)
        .filter(([_, d]) => d.qty > 0)
        .map(([id, d]) => ({ request_id: parseInt(id), quantity: d.qty }));
      
      await onCommit(data);
      setStep(3);
    } catch (e) {
      alert('Erro ao confirmar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = Object.keys(selectedItems).length;
  const totalQty = Object.values(selectedItems).reduce((s, i) => s + i.qty, 0);

  // Step Info: Shelter details
  const renderInfo = () => (
    <>
      <div className="bg-red-500 text-white p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">🆘</span>
            </div>
            <h2 className="text-lg font-bold">{shelter?.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex items-start gap-1.5 text-xs opacity-90">
          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
          <p>{shelter?.address}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-4">
          <h3 className="font-bold text-red-800 mb-2 flex items-center gap-1.5 text-sm">
            <span className="text-base">🔴</span>
            Doações Necessárias
          </h3>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg p-2.5 border border-red-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    {item.metadata.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.metadata.map(({key, label, value}) => (
                          <span key={key} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {label}: <span className="font-medium">{value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-xl font-bold text-red-600">{item.needed} {item.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setStep('select')}
          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-lg">🤝</span>
          Quero Ajudar
        </button>
      </div>
    </>
  );

  // Step Select: Choose items
  const renderSelect = () => (
    <>
      <div className="bg-green-500 text-white p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold">Escolha o que vai doar</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs opacity-90">Para: {shelter?.name}</p>
      </div>

      <div className="p-4 space-y-2 overflow-y-auto" style={{maxHeight: 'calc(80vh - 200px)'}}>
        {items.map(item => {
          const sel = selectedItems[item.id];
          return (
            <div 
              key={item.id} 
              onClick={() => toggleItem(item.id)}
              className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${sel ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${sel ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {sel && <Check size={14} className="text-white" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                  {item.metadata.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.metadata.map(({key, label, value}) => (
                        <span key={key} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {label}: <span className="font-medium">{value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-1">Necessário: <span className="font-semibold text-red-600">{item.needed} {item.unit}</span></p>
                </div>
              </div>
              
              {sel && (
                <div className="mt-2 flex items-center gap-2 pl-7">
                  <label className="text-xs text-gray-600">Vou doar:</label>
                  <input
                    type="number"
                    value={sel.qty}
                    onChange={(e) => { e.stopPropagation(); changeQty(item.id, e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 text-center py-1.5 border-2 border-green-500 rounded-lg font-bold"
                  />
                  <span className="text-gray-700 font-medium text-sm">{item.unit}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t p-4 bg-gray-50 space-y-2">
        {selectedCount > 0 && (
          <div className="flex justify-between text-xs bg-white p-2 rounded-lg">
            <span className="text-gray-600">{selectedCount} item(s) selecionado(s)</span>
            <span className="font-bold text-green-600">{totalQty} total</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setStep('info')}
            className="px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => setStep('confirm')}
            disabled={selectedCount === 0}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-colors ${selectedCount ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Continuar
          </button>
        </div>
      </div>
    </>
  );

  // Step Confirm
  const renderConfirm = () => {
    const list = items.filter(i => selectedItems[i.id]);
    return (
      <>
        <div className="bg-blue-500 text-white p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold">Confirmar Doação</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={20} /></button>
          </div>
          <p className="text-xs opacity-90">Revise os itens antes de confirmar</p>
        </div>

        <div className="p-4 overflow-y-auto" style={{maxHeight: 'calc(80vh - 200px)'}}>
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-1.5 text-xs">
              <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-500" />
              <div>
                <p className="font-semibold text-gray-900">{shelter?.name}</p>
                <p className="text-gray-600">{shelter?.address}</p>
              </div>
            </div>
          </div>

          <h3 className="font-bold text-gray-900 mb-2 text-sm">Itens a doar:</h3>
          <div className="space-y-2 mb-3">
            {list.map(item => (
              <div key={item.id} className="bg-white border-2 border-gray-200 rounded-lg p-2.5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    {item.metadata.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.metadata.map(({key, label, value}) => (
                          <span key={key} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {label}: <span className="font-medium">{value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-green-600 ml-2">{selectedItems[item.id].qty} {item.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <span className="font-bold">⚠️ Importante:</span> Ao confirmar, você se compromete a entregar estes itens no endereço indicado.
            </p>
          </div>
        </div>

        <div className="border-t p-4 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={() => setStep('select')}
              className="px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Confirmando...' : 'Confirmar Compromisso'}
            </button>
          </div>
        </div>
      </>
    );
  };

  // Step Success
  const renderSuccess = () => (
    <>
      <div className="bg-green-500 text-white p-6 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
          <Check size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold mb-1">Compromisso Confirmado!</h2>
        <p className="text-xs opacity-90">Obrigado por ajudar!</p>
      </div>

      <div className="p-4">
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">📍 Entregar em:</p>
          <p className="font-bold text-gray-900 text-sm">{shelter?.name}</p>
          <p className="text-xs text-gray-600">{shelter?.address}</p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
          <h3 className="font-bold text-blue-900 mb-2 text-sm">Próximos passos:</h3>
          <ol className="text-xs space-y-1.5 text-gray-700">
            <li className="flex gap-1.5"><span className="font-bold">1.</span> Leve os itens ao abrigo no endereço acima</li>
            <li className="flex gap-1.5"><span className="font-bold">2.</span> Peça o código de confirmação ao responsável</li>
            <li className="flex gap-1.5"><span className="font-bold">3.</span> Pronto! Sua doação será registrada</li>
          </ol>
        </div>
      </div>

      <div className="border-t p-4">
        <button
          onClick={onClose}
          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors"
        >
          Fechar
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
        style={{
          maxHeight: '85vh',
          transform: step === 'info' ? 'scale(0.95)' : 'scale(1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'info' && renderInfo()}
        {step === 'select' && renderSelect()}
        {step === 'confirm' && renderConfirm()}
        {step === 'success' && renderSuccess()}
      </div>
    </div>
  );
};

export default DonationCommitmentModal;
