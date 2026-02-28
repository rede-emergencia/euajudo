/**
 * Utilitários para máscara de telefone brasileiro
 * Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * Limite: 11 dígitos (máximo para telefones brasileiros)
 */

/**
 * Aplica máscara de telefone brasileiro
 * @param {string} value - Valor do telefone
 * @returns {string} - Telefone formatado
 */
export const formatPhone = (value) => {
  if (!value) return '';
  
  // Remove todos os caracteres não numéricos
  const cleaned = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos (máximo para telefones brasileiros)
  const limited = cleaned.slice(0, 11);
  
  // Aplica a máscara
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
};

/**
 * Remove máscara do telefone (deixa apenas números)
 * @param {string} value - Telefone formatado
 * @returns {string} - Apenas números
 */
export const unformatPhone = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

/**
 * Valida se o telefone está no formato brasileiro correto
 * @param {string} value - Telefone formatado
 * @returns {boolean} - Se é válido
 */
export const isValidPhone = (value) => {
  if (!value) return false;
  
  const cleaned = unformatPhone(value);
  
  // Verifica se tem exatamente 10 ou 11 dígitos
  if (cleaned.length !== 10 && cleaned.length !== 11) return false;
  
  // Verifica se o DDD é válido (2 dígitos entre 11 e 99)
  const ddd = parseInt(cleaned.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // Verifica se começa com 9 quando tem 11 dígitos (celular)
  if (cleaned.length === 11 && cleaned[2] !== '9') return false;
  
  // Verifica se o primeiro dígito após o DDD não é 0 ou 1 para telefones fixos
  if (cleaned.length === 10) {
    const firstDigitAfterDDD = parseInt(cleaned[2]);
    if (firstDigitAfterDDD < 2 || firstDigitAfterDDD > 9) return false;
  }
  
  return true;
};

/**
 * Handler para onChange de inputs de telefone
 * @param {object} e - Evento do input
 * @param {function} setter - Função para atualizar o estado
 */
export const handlePhoneChange = (e, setter) => {
  const value = e.target.value;
  const formatted = formatPhone(value);
  setter(formatted);
};

export default {
  formatPhone,
  unformatPhone,
  isValidPhone,
  handlePhoneChange
};
