// Funções utilitárias para produtos

export const getProductInfo = (productType) => {
  const products = {
    'meal': {
      name: 'Marmita',
      pluralName: 'Marmitas',
      icon: '🍽️',
      providerType: 'Cozinha/Restaurante',
      unit: 'unidades',
      action: 'retirar as marmitas',
      location: 'restaurante'
    },
    'medicine': {
      name: 'Medicamento',
      pluralName: 'Medicamentos',
      icon: '⚕️',
      providerType: 'Farmácia',
      unit: 'unidades',
      action: 'retirar os medicamentos',
      location: 'farmácia'
    },
    'hygiene': {
      name: 'Item de Higiene',
      pluralName: 'Itens de Higiene',
      icon: '🧼',
      providerType: 'ONG',
      unit: 'unidades',
      action: 'retirar os itens de higiene',
      location: 'ONG'
    },
    'clothing': {
      name: 'Roupa',
      pluralName: 'Roupas',
      icon: '👕',
      providerType: 'Bazar',
      unit: 'unidades',
      action: 'retirar as roupas',
      location: 'bazar'
    }
  };

  return products[productType] || products['meal']; // Default para meal
};

export const getProductText = (productType, quantity = 1) => {
  const info = getProductInfo(productType);
  const productName = quantity === 1 ? info.name : info.pluralName;
  return `${quantity} ${productName.toLowerCase()}`;
};

export const getProviderText = (productType) => {
  const info = getProductInfo(productType);
  return info.providerType;
};

export const getProductAction = (productType) => {
  const info = getProductInfo(productType);
  return info.action;
};

export const getProductLocation = (productType) => {
  const info = getProductInfo(productType);
  return info.location;
};
