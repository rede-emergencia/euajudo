"""
CategoryRepository - Data access for Category entities.

Domain-specific queries:
  - find_active: get active categories
  - find_by_name: unique category lookup
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import Category
from .base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    """Repository for Category entities with domain-specific queries."""
    
    def __init__(self, db: Session):
        super().__init__(Category, db)
    
    def find_active(self) -> List[Category]:
        """
        Find all active categories.
        
        Returns:
            List of active categories, sorted by display name
        """
        result = (
            self.db.query(Category)
            .filter(Category.active == True)
            .order_by(Category.display_name.asc())
            .all()
        )
        
        self._logger.debug(f"Found {len(result)} active categories")
        return result
    
    def find_by_name(self, name: str) -> Optional[Category]:
        """
        Find category by name (unique).
        
        Args:
            name: Category name
        
        Returns:
            Category or None
        """
        result = (
            self.db.query(Category)
            .filter(Category.name == name)
            .first()
        )
        
        self._logger.debug(f"Lookup category by name={name}, found={result is not None}")
        return result
