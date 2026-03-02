"""
BatchRepository - Data access for Batch entities.

Domain-specific queries:
  - find_active_by_provider: get provider's active batches
  - find_available: get batches available for delivery
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import Batch
from .base import BaseRepository


class BatchRepository(BaseRepository[Batch]):
    """Repository for Batch entities with domain-specific queries."""
    
    def __init__(self, db: Session):
        super().__init__(Batch, db)
    
    def find_by_provider(
        self, provider_id: int, active_only: bool = True
    ) -> List[Batch]:
        """
        Find batches by provider.
        
        Args:
            provider_id: ID of the provider
            active_only: If True, only active batches
        
        Returns:
            List of batches
        """
        query = self.db.query(Batch).filter(Batch.provider_id == provider_id)
        
        if active_only:
            query = query.filter(Batch.status == "active")
        
        result = query.order_by(Batch.created_at.desc()).all()
        
        self._logger.debug(
            f"Found {len(result)} batches for provider {provider_id} (active_only={active_only})"
        )
        return result
    
    def find_available(self, limit: Optional[int] = None) -> List[Batch]:
        """
        Find batches available for delivery.
        
        Args:
            limit: Max number of results
        
        Returns:
            List of available batches
        """
        query = (
            self.db.query(Batch)
            .filter(Batch.status == "active")
            .order_by(Batch.created_at.desc())
        )
        
        if limit:
            query = query.limit(limit)
        
        result = query.all()
        self._logger.debug(f"Found {len(result)} available batches")
        return result
