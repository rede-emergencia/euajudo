import { useState } from 'react';
import { X, Package, MapPin, Check, AlertCircle, ChevronRight, Heart } from 'lucide-react';

export default function DeliveryCommitmentModal({ 
  location,
  deliveries = [],
  onClose, 
  onCommit 
}) {
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'success'
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickupCode, setPickupCode] = useState('');

  if (!location || deliveries.length === 0) return null;

  const categoryToUnitMap = {
    'agua': 'litros',
    'alimentos': 'kg',
    'refeicoes_prontas': 'porções',
    'higiene': 'unidades',
    'roupas': 'peças',
    'medicamentos': 'unidades'
  };

  const toggleItem = (deliveryId) => {
    setSelectedItems(prev => {
      const newSelected = { ...prev };
      if (newSelected[deliveryId]) {
        delete newSelected[deliveryId];
      } else {
        const delivery = deliveries.find(d => d.id === deliveryId);
        newSelected[deliveryId] = {
          deliveryId,
          quantity: delivery.quantity,
          maxQuantity: delivery.quantity,
          category: delivery.category
        };
      }
      return newSelected;
    });
  };

  const updateQuantity = (deliveryId, quantity) => {
    setSelectedItems(prev => ({
      ...prev,
      [deliveryId]: {
        ...prev[deliveryId],
        quantity: Math.max(1, Math.min(quantity, prev[deliveryId].maxQuantity))
      }
    }));
  };

  const handleNext = () => {
    if (Object.keys(selectedItems).length === 0) {
      setError('Selecione pelo menos um item para ajudar');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const commitments = Object.values(selectedItems).map(item => ({
        delivery_id: item.deliveryId,
        quantity: item.quantity
      }));

      console.log('🚀 Modal: Enviando commitments:', commitments);
      const result = await onCommit(commitments);
      console.log('📊 Modal: Resultado recebido:', result);
      
      // Verificar se houve sucesso (pelo menos 1 commit bem-sucedido)
      if (result && result.results && result.results.length > 0) {
        // Sucesso! Pegar o pickup_code do primeiro resultado
        setPickupCode(result.pickup_code || result.results[0]?.pickup_code || '------');
        
        // Se tiver erro parcial, apenas logar (não mostrar erro para usuário)
        if (result.hasError) {
          console.warn('⚠️ Modal: Erro parcial detectado:', result.error);
        }
        
        setStep('success');
      } else {
        // Falha total - nenhum commit bem-sucedido
        console.error('❌ Modal: Nenhum commit bem-sucedido');
        setError(result?.error || 'Erro ao confirmar compromisso');
      }
    } catch (err) {
      console.error('❌ Modal: Erro completo:', err);
      setError(err.response?.data?.detail || err.message || 'Erro ao confirmar compromisso');
    } finally {
      // Sempre garantir que setLoading(false) seja chamado
      setLoading(false);
    }
  };

  const selectedCount = Object.keys(selectedItems).length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          padding: '24px',
          color: 'white',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex'
            }}>
              <Package size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                {step === 'select' && 'Escolha o que vai ajudar'}
                {step === 'confirm' && 'Confirmar compromisso'}
                {step === 'success' && '✅ Compromisso confirmado!'}
              </h2>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.9, fontSize: '14px' }}>
            <MapPin size={16} />
            <span>{location.name}</span>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {/* Etapa 1: Seleção */}
          {step === 'select' && (
            <>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                Selecione os itens que você pode ajudar a entregar:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {deliveries.map(delivery => {
                  const isSelected = !!selectedItems[delivery.id];
                  const unit = categoryToUnitMap[delivery.category?.name] || 'unidades';
                  
                  return (
                    <div
                      key={delivery.id}
                      style={{
                        border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        padding: '16px',
                        background: isSelected ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => toggleItem(delivery.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                          background: isSelected ? '#3b82f6' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isSelected && <Check size={16} color="white" />}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#111', marginBottom: '4px' }}>
                            {delivery.category?.display_name || 'Produto'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            Disponível: {delivery.quantity} {unit}
                          </div>
                        </div>

                        {isSelected && (
                          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => updateQuantity(delivery.id, selectedItems[delivery.id].quantity - 1)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: '600'
                              }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={selectedItems[delivery.id].quantity}
                              onChange={(e) => updateQuantity(delivery.id, parseInt(e.target.value) || 1)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '60px',
                                textAlign: 'center',
                                padding: '6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600'
                              }}
                            />
                            <button
                              onClick={() => updateQuantity(delivery.id, selectedItems[delivery.id].quantity + 1)}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: '600'
                              }}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </>
          )}

          {/* Etapa 2: Confirmação */}
          {step === 'confirm' && (
            <>
              <div style={{
                background: '#f0fdf4',
                border: '2px solid #86efac',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: '600', color: '#166534', marginBottom: '12px' }}>
                  Você vai ajudar com:
                </div>
                {Object.values(selectedItems).map(item => {
                  const unit = categoryToUnitMap[item.category?.name] || 'unidades';
                  return (
                    <div key={item.deliveryId} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #bbf7d0'
                    }}>
                      <span style={{ color: '#166534' }}>{item.category?.display_name}</span>
                      <span style={{ fontWeight: '600', color: '#166534' }}>
                        {item.quantity} {unit}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{
                background: '#fef3c7',
                border: '1px solid #fde047',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                color: '#92400e'
              }}>
                <strong>⚠️ Importante:</strong> Ao confirmar, você se compromete a retirar e entregar estes itens.
                Você receberá um código de retirada que deverá ser apresentado no local.
              </div>

              {error && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </>
          )}

          {/* Etapa 3: Sucesso */}
          {step === 'success' && (
            <>
              <div style={{
                textAlign: 'center',
                padding: '20px 0'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                }}>
                  <Heart size={40} color="white" fill="white" />
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '8px' }}>
                  Obrigado por ajudar!
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                  Seu compromisso foi confirmado com sucesso
                </p>

                <div style={{
                  background: '#f0fdf4',
                  border: '2px solid #86efac',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '12px', color: '#166534', marginBottom: '8px', fontWeight: '600' }}>
                    CÓDIGO DE RETIRADA
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#166534',
                    letterSpacing: '4px',
                    fontFamily: 'monospace'
                  }}>
                    {pickupCode}
                  </div>
                </div>

                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  color: '#1e40af',
                  textAlign: 'left'
                }}>
                  <strong>📋 Próximos passos:</strong>
                  <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    <li>Vá até o local de retirada</li>
                    <li>Apresente o código acima</li>
                    <li>Retire os itens</li>
                    <li>Entregue no destino</li>
                    <li>Confirme a entrega pelo app</li>
                  </ol>
                </div>

                <div style={{
                  marginTop: '16px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  Você pode acompanhar suas entregas em <strong>Ações</strong>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer com botões */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          {step === 'select' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                Cancelar
              </button>
              <button
                onClick={handleNext}
                disabled={selectedCount === 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: selectedCount > 0 ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : '#d1d5db',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Continuar ({selectedCount})
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <div>
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#dc2626' }}>
                    {error}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #e5e7eb',
                    background: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {error ? 'Fechar' : 'Cancelar'}
                </button>
                {!error && (
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: loading ? '#d1d5db' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? 'Confirmando...' : (
                      <>
                        <Check size={16} />
                        Confirmar Compromisso
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'success' && (
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
