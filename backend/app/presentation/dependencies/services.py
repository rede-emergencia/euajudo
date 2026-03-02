"""
Service Factories - Dependency Injection para services.

Cada service tem uma factory que injeta suas dependencies.
"""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.application.services.interfaces import IDonationService
from app.application.services.donation_commitment_service import DonationCommitmentService
from app.repositories import (
    DeliveryRepository,
    ShelterRequestRepository,
    LocationRepository,
)
from app.core.events import get_event_bus


def get_donation_service(
    db: Session = Depends(get_db),
) -> DonationCommitmentService:
    """
    Factory para DonationCommitmentService com database session.
    
    Returns:
        DonationCommitmentService implementação
    """
    return DonationCommitmentService(db)


# TODO: Adicionar factories para outros services
# def get_inventory_service(db: Session = Depends(get_db)) -> IInventoryService:
#     return InventoryService(db)
#
# def get_transaction_service(db: Session = Depends(get_db)) -> ITransactionService:
#     return ResourceTransactionService(db)
