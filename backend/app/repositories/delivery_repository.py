"""
DeliveryRepository - Data access for Delivery entities.

Domain-specific queries:
  - find_active_by_volunteer: check for duplicate active commitments
  - find_by_volunteer: volunteer's delivery history
  - find_pending_confirmations: shelters' pending deliveries
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models import Delivery
from app.shared.enums import DeliveryStatus
from .base import BaseRepository


class DeliveryRepository(BaseRepository[Delivery]):
    """Repository for Delivery entities with domain-specific queries."""
    
    def __init__(self, db: Session):
        super().__init__(Delivery, db)
    
    def find_active_by_volunteer(
        self, volunteer_id: int, exclude_recent_seconds: int = 30
    ) -> List[Delivery]:
        """
        Find active deliveries for a volunteer.
        
        Args:
            volunteer_id: ID of the volunteer
            exclude_recent_seconds: Grace period to allow multi-item commits
        
        Returns:
            List of active deliveries (excluding recent ones within grace period)
        """
        from datetime import datetime, timedelta
        
        active_statuses = [
            DeliveryStatus.PENDING_CONFIRMATION,
            DeliveryStatus.RESERVED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.IN_TRANSIT,
        ]
        
        grace_cutoff = datetime.utcnow() - timedelta(seconds=exclude_recent_seconds)
        
        deliveries = (
            self.db.query(Delivery)
            .filter(
                Delivery.volunteer_id == volunteer_id,
                Delivery.status.in_(active_statuses),
                Delivery.created_at <= grace_cutoff,
            )
            .all()
        )
        
        self._logger.debug(
            f"Found {len(deliveries)} active deliveries for volunteer {volunteer_id}"
        )
        return deliveries
    
    def find_by_volunteer(
        self,
        volunteer_id: int,
        is_donation: bool = True,
        limit: Optional[int] = None,
    ) -> List[Delivery]:
        """
        Find deliveries by volunteer ID.
        
        Args:
            volunteer_id: ID of the volunteer
            is_donation: If True, only direct donations (no batch, no pickup_location)
            limit: Max number of results
        
        Returns:
            List of deliveries, newest first
        """
        query = self.db.query(Delivery).filter(Delivery.volunteer_id == volunteer_id)
        
        if is_donation:
            query = query.filter(
                Delivery.batch_id.is_(None),
                Delivery.pickup_location_id.is_(None),
            )
        
        query = query.order_by(Delivery.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        result = query.all()
        self._logger.debug(
            f"Found {len(result)} deliveries for volunteer {volunteer_id} (donation={is_donation})"
        )
        return result
    
    def find_by_shelter(
        self,
        shelter_user_id: int,
        status: Optional[DeliveryStatus] = None,
        limit: Optional[int] = None,
    ) -> List[Delivery]:
        """
        Find deliveries destined for a shelter.
        
        Args:
            shelter_user_id: ID of the shelter user
            status: Optional status filter
            limit: Max number of results
        
        Returns:
            List of deliveries, newest first
        """
        # Join with DeliveryLocation to filter by shelter user_id
        from app.models import DeliveryLocation
        
        query = (
            self.db.query(Delivery)
            .join(DeliveryLocation, Delivery.delivery_location_id == DeliveryLocation.id)
            .filter(DeliveryLocation.user_id == shelter_user_id)
        )
        
        if status:
            query = query.filter(Delivery.status == status)
        
        query = query.order_by(Delivery.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        result = query.all()
        self._logger.debug(
            f"Found {len(result)} deliveries for shelter {shelter_user_id} (status={status})"
        )
        return result
    
    def find_by_pickup_code(self, pickup_code: str) -> Optional[Delivery]:
        """Find delivery by pickup code."""
        result = (
            self.db.query(Delivery)
            .filter(Delivery.pickup_code == pickup_code)
            .first()
        )
        self._logger.debug(f"Lookup delivery by pickup_code, found={result is not None}")
        return result
    
    def get_with_lock(self, delivery_id: int, volunteer_id: Optional[int] = None) -> Optional[Delivery]:
        """
        Get delivery with FOR UPDATE lock for safe concurrent updates.
        
        Args:
            delivery_id: ID of the delivery
            volunteer_id: If provided, also filter by volunteer_id (security check)
        
        Returns:
            Locked delivery or None
        """
        query = (
            self.db.query(Delivery)
            .filter(Delivery.id == delivery_id)
        )
        
        if volunteer_id is not None:
            query = query.filter(Delivery.volunteer_id == volunteer_id)
        
        result = query.with_for_update().first()
        self._logger.debug(
            f"Locked delivery id={delivery_id}, volunteer={volunteer_id}, found={result is not None}"
        )
        return result
