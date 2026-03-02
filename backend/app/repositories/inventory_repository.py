"""
InventoryItemRepository - Data access for inventory items.

Domain-specific queries:
  - find_by_shelter_and_category: lookup inventory for specific shelter+category
  - get_or_create: atomic get-or-create pattern
"""
from typing import Optional
from sqlalchemy.orm import Session

from app.inventory_models import InventoryItem
from .base import BaseRepository


class InventoryItemRepository(BaseRepository[InventoryItem]):
    """Repository for InventoryItem entities with domain-specific queries."""
    
    def __init__(self, db: Session):
        super().__init__(InventoryItem, db)
    
    def find_by_shelter_and_category(
        self, shelter_id: int, category_id: int
    ) -> Optional[InventoryItem]:
        """
        Find inventory item by shelter and category.
        
        Args:
            shelter_id: ID of the shelter
            category_id: ID of the category
        
        Returns:
            InventoryItem or None
        """
        result = (
            self.db.query(InventoryItem)
            .filter(
                InventoryItem.shelter_id == shelter_id,
                InventoryItem.category_id == category_id,
            )
            .first()
        )
        
        self._logger.debug(
            f"Lookup inventory shelter={shelter_id} category={category_id}, found={result is not None}"
        )
        return result
    
    def get_or_create(
        self, shelter_id: int, category_id: int
    ) -> InventoryItem:
        """
        Get existing inventory item or create new one.
        
        Args:
            shelter_id: ID of the shelter
            category_id: ID of the category
        
        Returns:
            Existing or newly created InventoryItem
        """
        item = self.find_by_shelter_and_category(shelter_id, category_id)
        
        if not item:
            item = self.create(
                shelter_id=shelter_id,
                category_id=category_id,
                quantity_in_stock=0,
                quantity_reserved=0,
            )
            self._logger.info(
                f"Created new inventory item: shelter={shelter_id}, category={category_id}"
            )
        
        return item
    
    def lock_for_update(
        self, shelter_id: int, category_id: int
    ) -> Optional[InventoryItem]:
        """
        Lock inventory item for update with FOR UPDATE.
        
        Args:
            shelter_id: ID of the shelter
            category_id: ID of the category
        
        Returns:
            Locked InventoryItem or None
        """
        result = (
            self.db.query(InventoryItem)
            .filter(
                InventoryItem.shelter_id == shelter_id,
                InventoryItem.category_id == category_id,
            )
            .with_for_update()
            .first()
        )
        
        self._logger.debug(
            f"Locked inventory shelter={shelter_id} category={category_id}, found={result is not None}"
        )
        return result
