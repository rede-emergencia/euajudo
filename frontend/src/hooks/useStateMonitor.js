/**
 * useStateMonitor - Hook para monitorar mudanças de estado
 * 
 * Detecta e registra todas as mudanças de estado do usuário
 */

import { useState, useEffect, useCallback } from 'react';
import { useUserState } from '../contexts/UserStateContext';

export const useStateMonitor = () => {
  const { userState } = useUserState();
  const [stateChanges, setStateChanges] = useState([]);
  const [lastChange, setLastChange] = useState(null);
  const [isChanging, setIsChanging] = useState(false);

  // Adicionar mudança ao histórico
  const addStateChange = useCallback((from, to, operation = null) => {
    const change = {
      id: Date.now(),
      from,
      to,
      operation,
      timestamp: new Date(),
      duration: null // Será calculado na próxima mudança
    };

    // Calcular duração da mudança anterior
    if (stateChanges.length > 0) {
      const prevChange = stateChanges[0];
      const duration = change.timestamp - prevChange.timestamp;
      prevChange.duration = duration;
    }

    setStateChanges(prev => [change, ...prev.slice(0, 9)]); // Manter 10 mais recentes
    setLastChange(change);
    
    // Disparar evento global
    window.dispatchEvent(new CustomEvent('userStateChange', {
      detail: { change, currentState: to }
    }));
  }, [stateChanges]);

  // Detectar mudanças de estado
  useEffect(() => {
    if (userState.currentState && userState.currentState !== lastChange?.to) {
      setIsChanging(true);
      
      addStateChange(
        lastChange?.to || 'idle',
        userState.currentState,
        userState.activeOperation
      );

      // Remover estado de transição após animação
      setTimeout(() => setIsChanging(false), 300);
    }
  }, [userState.currentState, lastChange, addStateChange]);

  // Obter estatísticas das mudanças
  const getStatistics = useCallback(() => {
    const stats = {
      totalChanges: stateChanges.length,
      averageDuration: 0,
      mostFrequentState: null,
      stateFrequency: {},
      recentActivity: stateChanges.slice(0, 5)
    };

    if (stateChanges.length === 0) return stats;

    // Calcular duração média
    const durations = stateChanges
      .filter(change => change.duration)
      .map(change => change.duration);
    
    if (durations.length > 0) {
      stats.averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    }

    // Calcular frequência de estados
    stateChanges.forEach(change => {
      stats.stateFrequency[change.to] = (stats.stateFrequency[change.to] || 0) + 1;
    });

    // Estado mais frequente
    const mostFrequent = Object.entries(stats.stateFrequency)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (mostFrequent) {
      stats.mostFrequentState = mostFrequent[0];
    }

    return stats;
  }, [stateChanges]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setStateChanges([]);
    setLastChange(null);
  }, []);

  return {
    // Estado atual
    stateChanges,
    lastChange,
    isChanging,
    
    // Ações
    clearHistory,
    
    // Análises
    getStatistics,
    
    // Verificações rápidas
    hasRecentActivity: stateChanges.length > 0,
    recentChangesCount: stateChanges.slice(0, 5).length,
    lastChangeTime: lastChange?.timestamp || null
  };
};

export default useStateMonitor;
