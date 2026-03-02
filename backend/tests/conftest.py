"""
Configuração global para testes.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.application.services.pickup_service import PickupCodeModel


@pytest.fixture(scope="session")
def test_engine():
    """Cria engine de teste."""
    return create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )


@pytest.fixture(scope="session")
def setup_database_session(test_engine):
    """Configura banco de teste."""
    # Criar tabelas principais
    Base.metadata.create_all(bind=test_engine)
    
    # Criar tabela pickup_codes
    PickupCodeModel.metadata.create_all(bind=test_engine)
    
    yield
    
    # Limpar
    PickupCodeModel.metadata.drop_all(bind=test_engine)
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db(test_engine, setup_database_session):
    """Cria sessão do banco para testes."""
    session = Session(bind=test_engine)
    try:
        yield session
    finally:
        session.close()
