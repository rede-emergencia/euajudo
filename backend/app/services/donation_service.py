"""
DonationService — Implementação limpa usando CommitmentService.

Este service implementa IDonationService usando diretamente DonationCommitmentService.
Sem legacy code, sem wrappers - implementação limpa para produção.
"""
from datetime import datetime
from typing import List

from sqlalchemy.orm import Session

from app.models import Delivery
from app.application.services.interfaces import IDonationService, CommitItem
from app.application.services.donation_commitment_service import DonationCommitmentService
from app.shared.exceptions import DonationError
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class DonationService(IDonationService):
    """
    Implementação de IDonationService usando DonationCommitmentService.
    
    Implementação limpa e direta para produção.
    """

    def __init__(self, db: Session):
        """
        Initialize service com DonationCommitmentService.
        
        Args:
            db: SQLAlchemy session
        """
        self._service = DonationCommitmentService(db)
        logger.info("DonationService initialized")

    def commit_donation(
        self,
        volunteer_id: int,
        shelter_user_id: int,
        items: List[CommitItem],
    ) -> dict:
        """
        Volunteer commits to bring donation items directly to a shelter.
        
        Args:
            volunteer_id: ID of the volunteer
            shelter_user_id: ID of the shelter user
            items: list of CommitItem objects
        
        Returns:
            dict with pickup_code and list of delivery IDs
        """
        try:
            # Converter CommitItem para formato esperado
            items_dict = [{"request_id": item.request_id, "quantity": item.quantity} for item in items]
            
            # Usar serviço diretamente
            result = self._service.commit(
                user_id=volunteer_id,
                target_id=shelter_user_id,
                items=items_dict
            )
            
            return {
                "code": result["code"],
                "delivery_ids": result["entity_ids"]
            }
            
        except DonationError:
            # Propagar DonationError diretamente
            raise
        except Exception as e:
            logger.error(f"Donation commit failed: {str(e)}")
            raise DonationError(f"Failed to commit donation: {str(e)}") from e

    def cancel_donation(self, delivery_id: int, volunteer_id: int) -> bool:
        """
        Volunteer cancels a pending commitment.
        """
        try:
            logger.info(f"Cancelling donation: delivery={delivery_id}, volunteer={volunteer_id}")
            
            result = self._service.cancel(
                commitment_id=delivery_id,
                user_id=volunteer_id
            )
            
            logger.info(f"Donation cancelled: delivery={delivery_id}")
            return result
            
        except DonationError:
            # Propagar DonationError diretamente
            raise
        except Exception as e:
            logger.error(f"Donation cancel failed: {str(e)}")
            raise DonationError(f"Failed to cancel donation: {str(e)}") from e

    def confirm_delivery(self, delivery_id: int, pickup_code: str, shelter_user_id: int) -> Delivery:
        """
        Shelter confirms receipt of donation using pickup_code.
        """
        try:
            logger.info(f"Confirming delivery: delivery={delivery_id}, code={pickup_code[:3]}***")
            
            delivery = self._service.confirm(
                commitment_id=delivery_id,
                confirmation_code=pickup_code,
                user_id=shelter_user_id
            )
            
            logger.info(f"Delivery confirmed: delivery={delivery_id}")
            return delivery
            
        except DonationError:
            # Propagar DonationError diretamente
            raise
        except Exception as e:
            logger.error(f"Delivery confirmation failed: {str(e)}")
            raise DonationError(f"Failed to confirm delivery: {str(e)}") from e
