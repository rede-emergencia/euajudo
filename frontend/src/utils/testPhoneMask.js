/**
 * Teste para máscara de telefone
 */

import { formatPhone, unformatPhone, isValidPhone } from './phoneMask.js';

console.log('=== Testes da Máscara de Telefone ===\n');

// Testes de formatação
const testCases = [
  '32988887777',
  '3236881234',
  '11988887777',
  '2134567890',
  '12345678901',
  '32912345678',
  '',
  '32999999999'
];

console.log('1. Testes de Formatação:');
testCases.forEach(test => {
  const formatted = formatPhone(test);
  console.log(`   ${test.padEnd(15)} → ${formatted}`);
});

console.log('\n2. Testes de Validação:');
const validationTests = [
  { phone: '(32) 98888-7777', expected: true },
  { phone: '(11) 98888-7777', expected: true },
  { phone: '(32) 8888-7777', expected: true },
  { phone: '(32) 2888-7777', expected: true },
  { phone: '(32) 9888-777', expected: true }, // telefone fixo válido
  { phone: '(32) 98888-77', expected: false }, // muito curto
  { phone: '(32) 988888-7777', expected: false }, // muito longo
  { phone: '(02) 98888-7777', expected: false }, // DDD inválido
  { phone: '(32) 78888-7777', expected: false }, // celular sem 9
  { phone: '(32) 1888-7777', expected: false }, // fixo começando com 1
  { phone: '', expected: false }
];

validationTests.forEach(({ phone, expected }) => {
  const valid = isValidPhone(phone);
  const status = valid === expected ? '✅' : '❌';
  console.log(`   ${status} ${phone.padEnd(18)} → ${valid} (esperado: ${expected})`);
});

console.log('\n3. Testes de Remoção de Máscara:');
const unformatTests = [
  '(32) 98888-7777',
  '(11) 8888-7777',
  '32988887777',
  '',
  '(32) 9-8888-7777' // formato inválido mas deve limpar
];

unformatTests.forEach(test => {
  const unformatted = unformatPhone(test);
  console.log(`   ${test.padEnd(20)} → ${unformatted}`);
});

console.log('\n=== Fim dos Testes ===');
