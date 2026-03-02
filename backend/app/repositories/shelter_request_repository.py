"""
ShelterRequestRepository - Data access for shelter donation requests.

Domain-specific queries:
  - find_active_by_shelter: active requests for a shelter
  - find_by_shelter_and_category: specific shelter+category lookup
  - lock_for_update: safe concurrent commitment
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.inventory_models import ShelterRequest
from .base import BaseRepository


class ShelterRequestRepository(BaseRepository[ShelterRequest]):
    """Repository for ShelterRequest entities with domain-specific queries."""
    
    def __init__(self, db: Session):
        super().__init__(ShelterRequest, db)
    
    def find_active_by_shelter(self, shelter_id: int) -> List[ShelterRequest]:
        """
        Find all active requests for a shelter.
        
        Args:
            shelter_id: ID of the shelter
        
        Returns:
            List of active/pending/partially_completed requests
        """
        result = (
            self.db.query(ShelterRequest)
            .filter(
                ShelterRequest.shelter_id == shelter_id,
                ShelterRequest.status.in_(["active", "pending", "partially_completed"]),
            )
            .order_by(ShelterRequest.created_at.asc())
            .all()
        )
        
        self._logger.debug(f"Found {len(result)} active requests for shelter {shelter_id}")
        return result
    
    def find_by_shelter_and_category(
        self, shelter_id: int, category_id: int, active_only: bool = True
    ) -> Optional[ShelterRequest]:
        """
        Find shelter request by shelter+category.
        
        Args:
            shelter_id: ID of the shelter
            category_id: ID of the category
            active_only: If True, only active/pending/partially_completed
        
        Returns:
            First matching request (oldest first) or None
        """
        query = self.db.query(ShelterRequest).filter(
            ShelterRequest.shelter_id == shelter_id,
            ShelterRequest.category_id == category_id,
        )
        
        if active_only:
            query = query.filter(
                ShelterRequest.status.in_(["active", "pending", "partially_completed"])
            )
        
        result = query.order_by(ShelterRequest.created_at.asc()).first()
        
        self._logger.debug(
            f"Lookup request shelter={shelter_id} category={category_id}, found={result is not None}"
        )
        return result
    
    def lock_for_commitment(
        self, request_id: int, shelter_id: int
    ) -> Optional[ShelterRequest]:
        """
        Lock a request for commitment with FOR UPDATE.
        
        Args:
            request_id: ID of the request
            shelter_id: ID of the shelter (security check)
        
        Returns:
            Locked request or None if not found/not available
        """
        result = (
            self.db.query(ShelterRequest)
            .filter(
                ShelterRequest.id == request_id,
                ShelterRequest.shelter_id == shelter_id,
                ShelterRequest.status.in_(["pending", "active", "partially_completed"]),
            )
            .with_for_update()
            .first()
        )
        
        self._logger.debug(
            f"Locked request id={request_id} shelter={shelter_id}, found={result is not None}"
        )
        return result
    
    def get_available_quantity(self, request_id: int) -> int:
        """
        Calculate available quantity for a request.
        
        Args:
            request_id: ID of the request
        
        Returns:
            Available quantity (requested - received)
        """
        request = self.get_by_id(request_id)
        if not request:
            return 0
        
        available = request.quantity_requested - (request.quantity_received or 0)
        self._logger.debug(f"Request {request_id} available quantity: {available}")
        return available
    
    def find_by_category(self, category_id: int, active_only: bool = True) -> List[ShelterRequest]:
        """
        Find all requests for a specific category.
        
        Args:
            category_id: ID of the category
            active_only: If True, only active/pending requests
        
        Returns:
            List of matching requests
        """
        query = self.db.query(ShelterRequest).filter(
            ShelterRequest.category_id == category_id
        )
        
        if active_only:
            query = query.filter(
                ShelterRequest.status.in_(["active", "pending", "partially_completed"])
            )
        
        result = query.order_by(ShelterRequest.created_at.desc()).all()
        self._logger.debug(
            f"Found {len(result)} requests for category {category_id} (active_only={active_only})"
        )
        return result
