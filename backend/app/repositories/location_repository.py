"""
LocationRepository - Data access for DeliveryLocation entities.

Domain-specific queries:
  - find_by_user: get locations for a user
  - find_active: get active/approved locations
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import DeliveryLocation
from .base import BaseRepository


class LocationRepository(BaseRepository[DeliveryLocation]):
    """Repository for DeliveryLocation entities with domain-specific queries."""
    
    def __init__(self, db: Session):
        super().__init__(DeliveryLocation, db)
    
    def find_by_user(self, user_id: int, active_only: bool = True) -> List[DeliveryLocation]:
        """
        Find all locations for a user.
        
        Args:
            user_id: ID of the user
            active_only: If True, only active locations
        
        Returns:
            List of locations
        """
        query = self.db.query(DeliveryLocation).filter(
            DeliveryLocation.user_id == user_id
        )
        
        if active_only:
            query = query.filter(DeliveryLocation.active == True)
        
        result = query.all()
        self._logger.debug(
            f"Found {len(result)} locations for user {user_id} (active_only={active_only})"
        )
        return result
    
    def find_primary_by_user(self, user_id: int) -> Optional[DeliveryLocation]:
        """
        Find primary location for a user.
        
        Args:
            user_id: ID of the user
        
        Returns:
            First active/approved location or None
        """
        result = (
            self.db.query(DeliveryLocation)
            .filter(
                DeliveryLocation.user_id == user_id,
                DeliveryLocation.active == True,
                DeliveryLocation.approved == True,
            )
            .first()
        )
        
        self._logger.debug(
            f"Primary location for user {user_id}: found={result is not None}"
        )
        return result
    
    def find_active_approved(self) -> List[DeliveryLocation]:
        """
        Find all active and approved locations.
        
        Returns:
            List of active/approved locations
        """
        result = (
            self.db.query(DeliveryLocation)
            .filter(
                DeliveryLocation.active == True,
                DeliveryLocation.approved == True,
            )
            .all()
        )
        
        self._logger.debug(f"Found {len(result)} active/approved locations")
        return result
