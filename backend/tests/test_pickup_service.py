"""
Testes para PickupService — Sistema confiável de códigos de pickup.

Testa todas as funcionalidades:
- Geração de códigos únicos e seguros
- Validação com regras de negócio
- Expiração automática
- Revogação de códigos
- Persistência e cache
- Logging e auditoria
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.application.services.pickup_service import PickupService, PickupCodeModel
from app.application.services.interfaces.pickup_service import (
    IPickupService,
    PickupCodeType,
    PickupCodeInfo
)
from app.database import Base, engine
from app.models import User


@pytest.fixture
def db():
    """Cria sessão do banco para testes."""
    # Criar todas as tabelas
    from app.models import Base as ModelBase
    ModelBase.metadata.create_all(bind=engine)
    
    # Criar tabela pickup_codes
    PickupCodeModel.metadata.create_all(bind=engine)
    
    session = Session(bind=engine)
    try:
        yield session
    finally:
        session.close()
        # Drop tables
        PickupCodeModel.metadata.drop_all(bind=engine)
        ModelBase.metadata.drop_all(bind=engine)


@pytest.fixture
def pickup_service(db):
    """Cria PickupService para testes."""
    return PickupService(db)


@pytest.fixture
def provider_user(db):
    """Cria usuário provedor."""
    user = User(
        name="Provider User",
        email="provider@test.com",
        hashed_password="test",
        roles="volunteer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def receiver_user(db):
    """Cria usuário receptor."""
    user = User(
        name="Receiver User",
        email="receiver@test.com",
        hashed_password="test",
        roles="shelter"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


class TestPickupService:
    """Testes para PickupService."""
    
    def test_generate_code_creates_valid_code(self, pickup_service, provider_user, receiver_user):
        """Testa geração de código válido."""
        code_info = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id,
            expires_in_hours=24
        )
        
        assert isinstance(code_info, PickupCodeInfo)
        assert code_info.entity_type == PickupCodeType.DELIVERY
        assert code_info.entity_id == 123
        assert code_info.provider_id == provider_user.id
        assert code_info.receiver_id == receiver_user.id
        assert code_info.expires_at > datetime.utcnow()
        assert code_info.code.startswith("DEL-")
        assert len(code_info.code) > 15  # Código deve ser longo o suficiente
    
    def test_generate_code_is_unique(self, pickup_service, provider_user, receiver_user):
        """Testa que códigos gerados são únicos."""
        codes = set()
        
        # Gerar 100 códigos
        for i in range(100):
            code_info = pickup_service.generate_code(
                entity_type=PickupCodeType.DELIVERY,
                entity_id=i,
                provider_id=provider_user.id,
                receiver_id=receiver_user.id
            )
            assert code_info.code not in codes
            codes.add(code_info.code)
    
    def test_validate_code_success(self, pickup_service, provider_user, receiver_user):
        """Testa validação bem-sucedida de código."""
        # Gerar código
        code_info = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id
        )
        
        # Validar código correto
        assert pickup_service.validate_code(
            code=code_info.code,
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            user_id=receiver_user.id  # Receptor validando
        ) is True
    
    def test_validate_code_wrong_user_fails(self, pickup_service, provider_user, receiver_user):
        """Testa que usuário errado não pode validar código."""
        # Gerar código
        code_info = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id
        )
        
        # Tentar validar com provedor (deve falhar)
        assert pickup_service.validate_code(
            code=code_info.code,
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            user_id=provider_user.id  # Provedor tentando validar
        ) is False
    
    def test_validate_code_wrong_entity_fails(self, pickup_service, provider_user, receiver_user):
        """Testa que código não funciona para entidade errada."""
        # Gerar código para delivery
        code_info = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id
        )
        
        # Tentar validar para reservation (deve falhar)
        assert pickup_service.validate_code(
            code=code_info.code,
            entity_type=PickupCodeType.RESERVATION,  # Tipo errado
            entity_id=123,
            user_id=receiver_user.id
        ) is False
    
    def test_validate_code_expired_fails(self, pickup_service, provider_user, receiver_user):
        """Testa que código expirado não é válido."""
        # Gerar código com expiração curta
        code_info = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id,
            expires_in_hours=-1  # Já expirado
        )
        
        # Validar código expirado
        assert pickup_service.validate_code(
            code=code_info.code,
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            user_id=receiver_user.id
        ) is False
    
    def test_validate_code_nonexistent_fails(self, pickup_service):
        """Testa que código inexistente não é válido."""
        assert pickup_service.validate_code(
            code="NONEXISTENT-CODE",
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            user_id=999
        ) is False
    
    def test_get_code_info(self, pickup_service, provider_user, receiver_user):
        """Testa obtenção de informações do código."""
        # Gerar código
        code_info = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id
        )
        
        # Obter informações
        retrieved = pickup_service.get_code_info(code_info.code)
        
        assert retrieved is not None
        assert retrieved.code == code_info.code
        assert retrieved.entity_type == code_info.entity_type
        assert retrieved.entity_id == code_info.entity_id
        assert retrieved.provider_id == code_info.provider_id
        assert retrieved.receiver_id == code_info.receiver_id
    
    def test_revoke_code(self, pickup_service, provider_user, receiver_user):
        """Testa revogação de código."""
        # Gerar código
        code_info = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id
        )
        
        # Validar antes de revogar
        assert pickup_service.validate_code(
            code=code_info.code,
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            user_id=receiver_user.id
        ) is True
        
        # Revogar código
        assert pickup_service.revoke_code(code_info.code) is True
        
        # Validar após revogar (deve falhar)
        assert pickup_service.validate_code(
            code=code_info.code,
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            user_id=receiver_user.id
        ) is False
    
    def test_revoke_nonexistent_code(self, pickup_service):
        """Testa revogar código inexistente."""
        assert pickup_service.revoke_code("NONEXISTENT-CODE") is False
    
    def test_cleanup_expired_codes(self, pickup_service, provider_user, receiver_user):
        """Testa limpeza de códigos expirados."""
        # Gerar códigos com diferentes expirações
        active_code = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=1,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id,
            expires_in_hours=24
        )
        
        expired_code = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=2,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id,
            expires_in_hours=-1  # Já expirado
        )
        
        # Limpar códigos expirados
        removed = pickup_service.cleanup_expired_codes()
        assert removed >= 1  # Pelo menos o código expirado
        
        # Código ativo ainda deve funcionar
        assert pickup_service.validate_code(
            code=active_code.code,
            entity_type=PickupCodeType.DELIVERY,
            entity_id=1,
            user_id=receiver_user.id
        ) is True
        
        # Código expirado não deve funcionar
        assert pickup_service.validate_code(
            code=expired_code.code,
            entity_type=PickupCodeType.DELIVERY,
            entity_id=2,
            user_id=receiver_user.id
        ) is False
    
    def test_persistence_across_instances(self, db, provider_user, receiver_user):
        """Testa persistência entre instâncias do serviço."""
        # Criar primeira instância e gerar código
        service1 = PickupService(db)
        code_info = service1.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id
        )
        
        # Criar segunda instância e validar código
        service2 = PickupService(db)
        assert service2.validate_code(
            code=code_info.code,
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            user_id=receiver_user.id
        ) is True
    
    def test_code_info_to_dict(self, pickup_service, provider_user, receiver_user):
        """Testa conversão de PickupCodeInfo para dicionário."""
        code_info = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=123,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id
        )
        
        data = code_info.to_dict()
        
        assert isinstance(data, dict)
        assert data["code"] == code_info.code
        assert data["entity_type"] == "delivery"
        assert data["entity_id"] == 123
        assert data["provider_id"] == provider_user.id
        assert data["receiver_id"] == receiver_user.id
        assert "expires_at" in data
        assert "created_at" in data
    
    def test_is_expired(self, pickup_service, provider_user, receiver_user):
        """Testa verificação de expiração."""
        # Código não expirado
        active_code = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=1,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id,
            expires_in_hours=24
        )
        assert active_code.is_expired() is False
        
        # Código expirado
        expired_code = pickup_service.generate_code(
            entity_type=PickupCodeType.DELIVERY,
            entity_id=2,
            provider_id=provider_user.id,
            receiver_id=receiver_user.id,
            expires_in_hours=-1
        )
        assert expired_code.is_expired() is True
