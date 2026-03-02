"""
IPickupService — Interface para serviço de pickup/código.

Define o contrato para geração e validação de códigos de pickup.
O receptor sempre fornece o código, o provedor valida.
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum


class PickupCodeType(str, Enum):
    """Tipos de código de pickup."""
    DELIVERY = "delivery"          # Para entregas
    RESERVATION = "reservation"    # Para reservas
    REQUEST = "request"           # Para pedidos


class PickupCodeInfo:
    """Informações sobre um código de pickup."""
    
    def __init__(
        self,
        code: str,
        entity_type: PickupCodeType,
        entity_id: int,
        provider_id: int,
        receiver_id: int,
        expires_at: datetime,
        created_at: Optional[datetime] = None
    ):
        self.code = code
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.provider_id = provider_id
        self.receiver_id = receiver_id
        self.expires_at = expires_at
        self.created_at = created_at or datetime.utcnow()
    
    def is_expired(self) -> bool:
        """Verifica se o código está expirado."""
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            "code": self.code,
            "entity_type": self.entity_type.value,
            "entity_id": self.entity_id,
            "provider_id": self.provider_id,
            "receiver_id": self.receiver_id,
            "expires_at": self.expires_at.isoformat(),
            "created_at": self.created_at.isoformat()
        }


class IPickupService(ABC):
    """
    Interface para serviço de pickup/código.
    
    Responsabilidades:
    - Gerar códigos únicos e seguros
    - Validar códigos com regras de negócio
    - Gerenciar expiração de códigos
    - Garantir que apenas o receptor possa usar o código
    """
    
    @abstractmethod
    def generate_code(
        self,
        entity_type: PickupCodeType,
        entity_id: int,
        provider_id: int,
        receiver_id: int,
        expires_in_hours: int = 24
    ) -> PickupCodeInfo:
        """
        Gera um novo código de pickup.
        
        Args:
            entity_type: Tipo da entidade
            entity_id: ID da entidade
            provider_id: ID do provedor (quem entrega)
            receiver_id: ID do receptor (quem recebe)
            expires_in_hours: Horas para expiração
            
        Returns:
            PickupCodeInfo com informações do código
        """
        pass
    
    @abstractmethod
    def validate_code(
        self,
        code: str,
        entity_type: PickupCodeType,
        entity_id: int,
        user_id: int
    ) -> bool:
        """
        Valida se o código é válido para o usuário e entidade.
        
        Args:
            code: Código informado
            entity_type: Tipo da entidade
            entity_id: ID da entidade
            user_id: ID do usuário validando
            
        Returns:
            True se código é válido
        """
        pass
    
    @abstractmethod
    def get_code_info(self, code: str) -> Optional[PickupCodeInfo]:
        """
        Obtém informações sobre um código.
        
        Args:
            code: Código a buscar
            
        Returns:
            PickupCodeInfo ou None se não encontrado
        """
        pass
    
    @abstractmethod
    def revoke_code(self, code: str) -> bool:
        """
        Revoga um código (torna inválido).
        
        Args:
            code: Código a revogar
            
        Returns:
            True se revogado com sucesso
        """
        pass
    
    @abstractmethod
    def cleanup_expired_codes(self) -> int:
        """
        Limpa códigos expirados.
        
        Returns:
            Número de códigos removidos
        """
        pass
