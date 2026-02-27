import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusBadgeClass(status) {
  const statusMap = {
    disponivel: 'badge-info',
    parcialmente_reservado: 'badge-warning',
    reservado_completo: 'badge-warning',
    entregue: 'badge-success',
    expirado: 'badge-danger',
    ativa: 'badge-info',
    cancelada: 'badge-danger',
    expirada: 'badge-danger',
    em_producao: 'badge-warning',
    pronto: 'badge-success',
    em_entrega: 'badge-info',
    aceita: 'badge-info',
    em_rota: 'badge-warning',
  };
  return statusMap[status] || 'badge-info';
}

export function getStatusLabel(status) {
  const statusMap = {
    disponivel: 'Disponível',
    parcialmente_reservado: 'Parcialmente Reservado',
    reservado_completo: 'Reservado Completo',
    entregue: 'Entregue',
    expirado: 'Expirado',
    ativa: 'Ativa',
    cancelada: 'Cancelada',
    expirada: 'Expirada',
    em_producao: 'Em Produção',
    pronto: 'Pronto',
    em_entrega: 'Em Entrega',
    aceita: 'Aceita',
    em_rota: 'Em Rota',
  };
  return statusMap[status] || status;
}
