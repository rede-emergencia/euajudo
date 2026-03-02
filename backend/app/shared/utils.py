"""
Utility Functions - Funções utilitárias compartilhadas.

Funções genéricas que são usadas em múltiplos domínios.
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets


def format_datetime(dt: datetime, format: str = "%d/%m/%Y %H:%M") -> str:
    """
    Formata datetime para display.
    
    Args:
        dt: Datetime para formatar
        format: Formato de saída (padrão: DD/MM/YYYY HH:MM)
    
    Returns:
        String formatada
    """
    return dt.strftime(format)


def add_hours(dt: datetime, hours: int) -> datetime:
    """
    Adiciona horas a um datetime.
    
    Args:
        dt: Datetime base
        hours: Número de horas a adicionar
    
    Returns:
        Novo datetime
    """
    return dt + timedelta(hours=hours)


def generate_random_code(length: int = 6) -> str:
    """
    Gera código numérico aleatório.
    
    Args:
        length: Tamanho do código (padrão: 6)
    
    Returns:
        String numérica aleatória
    """
    return ''.join(str(secrets.randbelow(10)) for _ in range(length))


def hash_string(text: str) -> str:
    """
    Gera hash SHA256 de uma string.
    
    Args:
        text: Texto para hash
    
    Returns:
        Hash hexadecimal
    """
    return hashlib.sha256(text.encode()).hexdigest()


def truncate_string(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Trunca string se exceder tamanho máximo.
    
    Args:
        text: Texto para truncar
        max_length: Tamanho máximo
        suffix: Sufixo para adicionar (padrão: "...")
    
    Returns:
        String truncada
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def parse_bool(value: any) -> bool:
    """
    Parse flexível de boolean.
    
    Args:
        value: Valor para converter
    
    Returns:
        Boolean
    """
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'y', 'on')
    return bool(value)


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """
    Divisão segura (evita divisão por zero).
    
    Args:
        numerator: Numerador
        denominator: Denominador
        default: Valor padrão se denominador for zero
    
    Returns:
        Resultado da divisão ou valor padrão
    """
    if denominator == 0:
        return default
    return numerator / denominator


def calculate_percentage(part: float, total: float) -> Optional[float]:
    """
    Calcula porcentagem.
    
    Args:
        part: Parte
        total: Total
    
    Returns:
        Porcentagem (0-100) ou None se total for zero
    """
    if total == 0:
        return None
    return (part / total) * 100
