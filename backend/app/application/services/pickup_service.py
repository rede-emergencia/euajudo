"""
PickupService — Implementação confiável de serviço de pickup/código.

Implementação robusta que garante:
- Códigos únicos e seguros
- Validação correta (apenas receptor pode usar)
- Gerenciamento de expiração
- Persistência em memória com fallback
- Logging e auditoria
"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import secrets
import hashlib
from dataclasses import dataclass, asdict

from sqlalchemy.orm import Session
from sqlalchemy import Column, String, Integer, DateTime, Text, Index
from sqlalchemy.ext.declarative import declarative_base

from .interfaces.pickup_service import (
    IPickupService,
    PickupCodeType,
    PickupCodeInfo
)
from app.shared.constants import PICKUP_CODE_LENGTH, COMMITMENT_TTL_HOURS
from app.shared.utils import generate_random_code
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# Modelo para persistência
Base = declarative_base()


class PickupCodeModel(Base):
    """Modelo para persistência de códigos de pickup."""
    __tablename__ = "pickup_codes"
    
    code = Column(String(20), primary_key=True, index=True)
    entity_type = Column(String(20), nullable=False)
    entity_id = Column(Integer, nullable=False)
    provider_id = Column(Integer, nullable=False)
    receiver_id = Column(Integer, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    metadata_json = Column(Text, nullable=True)
    
    # Índices para performance
    __table_args__ = (
        Index('idx_entity', 'entity_type', 'entity_id'),
        Index('idx_receiver', 'receiver_id'),
        Index('idx_expires', 'expires_at'),
    )


@dataclass
class InMemoryCode:
    """Estrutura para código em memória."""
    info: PickupCodeInfo
    revoked: bool = False
    revoked_at: Optional[datetime] = None


class PickupService(IPickupService):
    """
    Implementação robusta do serviço de pickup.
    
    Características:
    - Geração de códigos seguros e únicos
    - Validação com regras de negócio
    - Cache em memória para performance
    - Persistência em banco para recuperação
    - Logging completo para auditoria
    """
    
    def __init__(self, db: Session):
        """
        Inicializa o serviço.
        
        Args:
            db: Sessão do banco de dados
        """
        self.db = db
        self._cache: Dict[str, InMemoryCode] = {}
        self._logger = logger
        
        # Carregar códigos ativos do banco na inicialização
        self._load_active_codes()
    
    def generate_code(
        self,
        entity_type: PickupCodeType,
        entity_id: int,
        provider_id: int,
        receiver_id: int,
        expires_in_hours: int = COMMITMENT_TTL_HOURS
    ) -> PickupCodeInfo:
        """
        Gera um novo código de pickup seguro de 6 dígitos.
        
        O código é gerado com apenas 6 dígitos numéricos.
        """
        try:
            # Gerar código de 6 dígitos apenas
            code = generate_random_code(PICKUP_CODE_LENGTH)
            
            # Criar informações do código
            expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
            code_info = PickupCodeInfo(
                code=code,
                entity_type=entity_type,
                entity_id=entity_id,
                provider_id=provider_id,
                receiver_id=receiver_id,
                expires_at=expires_at
            )
            
            # Salvar em memória
            self._cache[code] = InMemoryCode(info=code_info)
            
            # Persistir no banco
            self._persist_code(code_info)
            
            self._logger.info(
                f"Generated pickup code: {code} "
                f"for {entity_type.value}:{entity_id} "
                f"(expires: {expires_at})"
            )
            
            return code_info
            
        except Exception as e:
            self._logger.error(f"Failed to generate pickup code: {str(e)}")
            raise
    
    def validate_code(
        self,
        code: str,
        entity_type: PickupCodeType,
        entity_id: int,
        user_id: int
    ) -> bool:
        """
        Valida código com regras de negócio.
        
        Regras:
        1. Código deve existir
        2. Não pode estar expirado
        3. Não pode estar revogado
        4. Usuário deve ser o receptor
        5. Entidade deve corresponder
        """
        try:
            # Buscar código
            code_info = self.get_code_info(code)
            if not code_info:
                self._logger.warning(f"Invalid code attempted: {code[:15]}...")
                return False
            
            # Validar expiração
            if code_info.is_expired():
                self._logger.warning(f"Expired code attempted: {code[:15]}...")
                return False
            
            # Validar revogação
            cached = self._cache.get(code)
            if cached and cached.revoked:
                self._logger.warning(f"Revoked code attempted: {code[:15]}...")
                return False
            
            # Validar usuário (apenas receptor pode usar)
            if code_info.receiver_id != user_id:
                self._logger.warning(
                    f"Unauthorized user {user_id} attempted code {code[:15]}... "
                    f"(expected receiver: {code_info.receiver_id})"
                )
                return False
            
            # Validar entidade
            if code_info.entity_type != entity_type or code_info.entity_id != entity_id:
                self._logger.warning(
                    f"Code {code[:15]}... used for wrong entity: "
                    f"expected {entity_type.value}:{entity_id}, "
                    f"got {code_info.entity_type.value}:{code_info.entity_id}"
                )
                return False
            
            self._logger.info(
                f"Code validated successfully: {code[:15]}... "
                f"by user {user_id} for {entity_type.value}:{entity_id}"
            )
            
            return True
            
        except Exception as e:
            self._logger.error(f"Error validating pickup code: {str(e)}")
            return False
    
    def get_code_info(self, code: str) -> Optional[PickupCodeInfo]:
        """
        Obtém informações do código.
        
        Busca em cache primeiro, depois no banco.
        """
        try:
            # Buscar em cache
            cached = self._cache.get(code)
            if cached:
                return cached.info
            
            # Buscar no banco
            model = self.db.query(PickupCodeModel).filter(
                PickupCodeModel.code == code
            ).first()
            
            if model:
                # Reconstruir informações
                code_info = PickupCodeInfo(
                    code=model.code,
                    entity_type=PickupCodeType(model.entity_type),
                    entity_id=model.entity_id,
                    provider_id=model.provider_id,
                    receiver_id=model.receiver_id,
                    expires_at=model.expires_at,
                    created_at=model.created_at
                )
                
                # Adicionar ao cache
                revoked = model.revoked_at is not None
                self._cache[code] = InMemoryCode(
                    info=code_info,
                    revoked=revoked,
                    revoked_at=model.revoked_at
                )
                
                return code_info
            
            return None
            
        except Exception as e:
            self._logger.error(f"Error getting code info: {str(e)}")
            return None
    
    def revoke_code(self, code: str) -> bool:
        """
        Revoga um código.
        
        Marca como inválido imediatamente.
        """
        try:
            # Buscar código
            code_info = self.get_code_info(code)
            if not code_info:
                return False
            
            # Marcar como revogado em cache
            cached = self._cache.get(code)
            if cached:
                cached.revoked = True
                cached.revoked_at = datetime.utcnow()
            
            # Atualizar no banco
            self.db.query(PickupCodeModel).filter(
                PickupCodeModel.code == code
            ).update({"revoked_at": datetime.utcnow()})
            self.db.commit()
            
            self._logger.info(f"Code revoked: {code[:15]}...")
            return True
            
        except Exception as e:
            self._logger.error(f"Error revoking pickup code: {str(e)}")
            self.db.rollback()
            return False
    
    def cleanup_expired_codes(self) -> int:
        """
        Limpa códigos expirados.
        
        Remove de cache e do banco.
        """
        try:
            now = datetime.utcnow()
            removed_count = 0
            
            # Limpar cache
            expired_codes = [
                code for code, cached in self._cache.items()
                if cached.info.is_expired()
            ]
            
            for code in expired_codes:
                del self._cache[code]
                removed_count += 1
            
            # Limpar banco
            deleted = self.db.query(PickupCodeModel).filter(
                PickupCodeModel.expires_at < now
            ).delete()
            
            self.db.commit()
            removed_count += deleted
            
            if removed_count > 0:
                self._logger.info(f"Cleaned up {removed_count} expired pickup codes")
            
            return removed_count
            
        except Exception as e:
            self._logger.error(f"Error cleaning up expired codes: {str(e)}")
            self.db.rollback()
            return 0
    
    # Métodos privados
    
    def _load_active_codes(self) -> None:
        """Carrega códigos ativos do banco para cache."""
        try:
            now = datetime.utcnow()
            models = self.db.query(PickupCodeModel).filter(
                PickupCodeModel.expires_at > now,
                PickupCodeModel.revoked_at.is_(None)
            ).all()
            
            for model in models:
                code_info = PickupCodeInfo(
                    code=model.code,
                    entity_type=PickupCodeType(model.entity_type),
                    entity_id=model.entity_id,
                    provider_id=model.provider_id,
                    receiver_id=model.receiver_id,
                    expires_at=model.expires_at,
                    created_at=model.created_at
                )
                
                self._cache[model.code] = InMemoryCode(info=code_info)
            
            self._logger.info(f"Loaded {len(models)} active pickup codes to cache")
            
        except Exception as e:
            self._logger.error(f"Error loading active codes: {str(e)}")
    
    def _persist_code(self, code_info: PickupCodeInfo) -> None:
        """Persiste código no banco."""
        try:
            model = PickupCodeModel(
                code=code_info.code,
                entity_type=code_info.entity_type.value,
                entity_id=code_info.entity_id,
                provider_id=code_info.provider_id,
                receiver_id=code_info.receiver_id,
                expires_at=code_info.expires_at,
                created_at=code_info.created_at,
                metadata_json=str(code_info.to_dict())
            )
            
            self.db.add(model)
            self.db.commit()
            
        except Exception as e:
            self._logger.error(f"Error persisting pickup code: {str(e)}")
            self.db.rollback()
            raise
