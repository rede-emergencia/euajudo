import { useState, useEffect } from 'react';
import { categories } from '../lib/api';

export default function ItemFormModal({ 
  onClose, 
  onSubmit, 
  title, 
  description, 
  submitButtonText,
  initialData = {},
  showQuantityField = true,
  quantityFieldName = 'quantity_in_stock',
  quantityLabel = 'Quantidade *',
  quantityPlaceholder = 'Ex: 50',
  filterProductCategories = false,
  hideMetadata = false
}) {
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockForm, setStockForm] = useState({
    category_id: '',
    [quantityFieldName]: '',
    min_threshold: '',
    metadata: {},
    ...initialData
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categories.list();
      setCategoryList(response.data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAttributesForCategory = (categoryId) => {
    const category = categoryList.find(c => c.id === parseInt(categoryId));
    return category?.attributes || [];
  };

  const attributes = getAttributesForCategory(stockForm.category_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Helper function to normalize metadata values
    const normalizeMetadata = (metadata) => {
      const normalized = { ...metadata };
      
      // Convert numeric fields from string to number
      Object.keys(normalized).forEach(key => {
        const value = normalized[key];
        if (key === 'quantidade' && value !== undefined && value !== '') {
          normalized[key] = parseInt(value) || 0;
        }
      });
      
      return normalized;
    };
    
    const normalizedMetadata = normalizeMetadata(stockForm.metadata);
    
    // Use quantidade from metadata if available, otherwise use the quantity field
    const metadataQuantidade = normalizedMetadata.quantidade;
    const quantityValue = metadataQuantidade !== undefined && metadataQuantidade !== '' 
      ? parseInt(metadataQuantidade) || 0
      : parseInt(stockForm[quantityFieldName]) || 0;
    
    const submitData = {
      ...stockForm,
      [quantityFieldName]: quantityValue,
      metadata_cache: normalizedMetadata,
    };
    
    console.log('🔍 DEBUG ItemFormModal - Dados enviados:', submitData);
    await onSubmit(submitData);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {description}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select
                value={stockForm.category_id}
                onChange={e => {
                  setStockForm(f => ({ ...f, category_id: e.target.value, metadata: {} }));
                }}
                required
                className="w-full border rounded-lg p-2"
              >
                <option value="">Selecione...</option>
                {(filterProductCategories 
                  ? categoryList.filter(c => !c.name.startsWith('servico_'))
                  : categoryList
                ).map(c => (
                  <option key={c.id} value={c.id}>{c.display_name || c.name}</option>
                ))}
              </select>
            </div>

            {/* Dynamic metadata fields */}
            {!hideMetadata && attributes.map(attr => (
              <div key={attr.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {attr.display_name} {attr.required && '*'}
                </label>
                {attr.attribute_type === 'select' ? (
                  <select
                    value={stockForm.metadata[attr.name] || ''}
                    onChange={e => setStockForm(f => ({
                      ...f,
                      metadata: { ...f.metadata, [attr.name]: e.target.value }
                    }))}
                    required={attr.required}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Selecione...</option>
                    {attr.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : attr.attribute_type === 'number' ? (
                  <input
                    type="number"
                    value={stockForm.metadata[attr.name] || ''}
                    onChange={e => setStockForm(f => ({
                      ...f,
                      metadata: { ...f.metadata, [attr.name]: e.target.value }
                    }))}
                    required={attr.required}
                    min={attr.min_value}
                    max={attr.max_value}
                    className="w-full border rounded-lg p-2"
                    placeholder="Ex: 10"
                  />
                ) : (
                  <input
                    type="text"
                    value={stockForm.metadata[attr.name] || ''}
                    onChange={e => setStockForm(f => ({
                      ...f,
                      metadata: { ...f.metadata, [attr.name]: e.target.value }
                    }))}
                    required={attr.required}
                    maxLength={attr.max_length}
                    className="w-full border rounded-lg p-2"
                    placeholder="Digite aqui..."
                  />
                )}
              </div>
            ))}

            {showQuantityField && (hideMetadata || attributes.length === 0) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {quantityLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockForm[quantityFieldName]}
                  onChange={e => setStockForm(f => ({ ...f, [quantityFieldName]: e.target.value }))}
                  required
                  className="w-full border rounded-lg p-2"
                  placeholder={quantityPlaceholder}
                />
              </div>
            )}

            {/* Campo de observações para pedidos (quando showQuantityField é false) */}
            {!showQuantityField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
                <textarea
                  value={stockForm.notes || ''}
                  onChange={e => setStockForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border rounded-lg p-2"
                  placeholder="Ex: Urgente, precisamos de roupas infantis"
                  rows={2}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                {submitButtonText}
              </button>
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
