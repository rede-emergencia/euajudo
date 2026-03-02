"""
Base Repository Pattern - Interface ABC + Implementation

IRepository[T]: Abstract interface defining the contract
BaseRepository[T]: Generic implementation of common CRUD operations

All concrete repositories inherit from both.
"""
from abc import ABC, abstractmethod
from typing import List, Optional, TypeVar, Generic, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


class IRepository(ABC, Generic[T]):
    """
    Abstract Repository Interface.
    
    All repositories must implement this interface.
    Defines the contract for data access operations.
    """
    
    @abstractmethod
    def create(self, **kwargs) -> T:
        """Create and persist a new entity."""
        pass
    
    @abstractmethod
    def get_by_id(self, id: int, lock: bool = False) -> Optional[T]:
        """Get entity by ID. If lock=True, use FOR UPDATE."""
        pass
    
    @abstractmethod
    def list_all(self, order_by=None, limit: int = None) -> List[T]:
        """List all entities with optional ordering and limit."""
        pass
    
    @abstractmethod
    def filter_by(self, **filters) -> List[T]:
        """Filter entities by arbitrary field=value filters."""
        pass
    
    @abstractmethod
    def update(self, instance: T, **kwargs) -> T:
        """Update entity attributes."""
        pass
    
    @abstractmethod
    def delete(self, instance_id: int) -> bool:
        """Delete entity by ID. Returns True if deleted."""
        pass
    
    @abstractmethod
    def delete_instance(self, instance: T) -> bool:
        """Delete entity instance. Returns True if deleted."""
        pass
    
    @abstractmethod
    def exists(self, id: int) -> bool:
        """Check if entity exists by ID."""
        pass
    
    @abstractmethod
    def count(self, **filters) -> int:
        """Count entities matching filters."""
        pass
    
    @abstractmethod
    def commit(self):
        """Commit current transaction."""
        pass
    
    @abstractmethod
    def rollback(self):
        """Rollback current transaction."""
        pass
    
    @abstractmethod
    def flush(self):
        """Flush changes to database without committing."""
        pass
    
    @abstractmethod
    def refresh(self, instance: T) -> T:
        """Refresh entity from database."""
        pass


class BaseRepository(IRepository[T]):
    """
    Generic implementation of IRepository interface.
    
    Provides common CRUD operations with logging and error handling.
    Concrete repositories inherit from this and add domain-specific methods.
    
    Example:
        class UserRepository(BaseRepository[User]):
            def __init__(self, db: Session):
                super().__init__(User, db)
            
            def find_by_email(self, email: str) -> Optional[User]:
                # Domain-specific query
                return self.db.query(self.model_class).filter(...).first()
    """
    
    def __init__(self, model_class: type, db: Session):
        self.model_class = model_class
        self.db = db
        self._logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
    
    def create(self, **kwargs) -> T:
        """Create new entity."""
        try:
            instance = self.model_class(**kwargs)
            self.db.add(instance)
            self.db.flush()
            self._logger.debug(f"Created {self.model_class.__name__} with id={instance.id}")
            return instance
        except Exception as e:
            self._logger.error(f"Failed to create {self.model_class.__name__}: {e}")
            raise
    
    def get_by_id(self, id: int, lock: bool = False) -> Optional[T]:
        """Get entity by ID. If lock=True, use FOR UPDATE."""
        try:
            query = self.db.query(self.model_class).filter(self.model_class.id == id)
            if lock:
                query = query.with_for_update()
            result = query.first()
            self._logger.debug(f"Retrieved {self.model_class.__name__} id={id}, found={result is not None}")
            return result
        except Exception as e:
            self._logger.error(f"Failed to get {self.model_class.__name__} id={id}: {e}")
            raise
    
    def list_all(self, order_by=None, limit: int = None) -> List[T]:
        """List all entities with optional ordering and limit."""
        try:
            query = self.db.query(self.model_class)
            
            if order_by is not None:
                query = query.order_by(order_by)
            elif hasattr(self.model_class, 'created_at'):
                query = query.order_by(desc(self.model_class.created_at))
            
            if limit:
                query = query.limit(limit)
            
            result = query.all()
            self._logger.debug(f"Listed {len(result)} {self.model_class.__name__} entities")
            return result
        except Exception as e:
            self._logger.error(f"Failed to list {self.model_class.__name__}: {e}")
            raise
    
    def filter_by(self, **filters) -> List[T]:
        """Filter entities by field=value pairs."""
        try:
            query = self.db.query(self.model_class)
            
            for key, value in filters.items():
                if value is not None:
                    query = query.filter(getattr(self.model_class, key) == value)
            
            if hasattr(self.model_class, 'created_at'):
                query = query.order_by(desc(self.model_class.created_at))
            
            result = query.all()
            self._logger.debug(f"Filtered {self.model_class.__name__} with {filters}, found {len(result)}")
            return result
        except Exception as e:
            self._logger.error(f"Failed to filter {self.model_class.__name__}: {e}")
            raise
    
    def update(self, instance: T, **kwargs) -> T:
        """Update entity attributes."""
        try:
            for key, value in kwargs.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)
            
            self.db.flush()
            self._logger.debug(f"Updated {self.model_class.__name__} id={instance.id} with {list(kwargs.keys())}")
            return instance
        except Exception as e:
            self._logger.error(f"Failed to update {self.model_class.__name__}: {e}")
            raise
    
    def delete(self, instance_id: int) -> bool:
        """Delete entity by ID. Returns True if deleted."""
        try:
            instance = self.get_by_id(instance_id)
            if instance:
                self.db.delete(instance)
                self.db.flush()
                self._logger.debug(f"Deleted {self.model_class.__name__} id={instance_id}")
                return True
            self._logger.warning(f"{self.model_class.__name__} id={instance_id} not found for deletion")
            return False
        except Exception as e:
            self._logger.error(f"Failed to delete {self.model_class.__name__} id={instance_id}: {e}")
            raise
    
    def delete_instance(self, instance: T) -> bool:
        """Delete entity instance. Returns True if deleted."""
        try:
            self.db.delete(instance)
            self.db.flush()
            self._logger.debug(f"Deleted {self.model_class.__name__} instance id={instance.id}")
            return True
        except Exception as e:
            self._logger.error(f"Failed to delete {self.model_class.__name__} instance: {e}")
            raise
    
    def exists(self, id: int) -> bool:
        """Check if entity exists by ID."""
        try:
            result = self.db.query(self.model_class.id).filter(self.model_class.id == id).first() is not None
            self._logger.debug(f"{self.model_class.__name__} id={id} exists={result}")
            return result
        except Exception as e:
            self._logger.error(f"Failed to check existence of {self.model_class.__name__} id={id}: {e}")
            raise
    
    def count(self, **filters) -> int:
        """Count entities matching filters."""
        try:
            query = self.db.query(self.model_class)
            
            for key, value in filters.items():
                if value is not None:
                    query = query.filter(getattr(self.model_class, key) == value)
            
            result = query.count()
            self._logger.debug(f"Counted {result} {self.model_class.__name__} with filters {filters}")
            return result
        except Exception as e:
            self._logger.error(f"Failed to count {self.model_class.__name__}: {e}")
            raise
    
    def commit(self):
        """Commit current transaction."""
        try:
            self.db.commit()
            self._logger.debug(f"Transaction committed for {self.model_class.__name__}")
        except Exception as e:
            self._logger.error(f"Failed to commit transaction for {self.model_class.__name__}: {e}")
            raise
    
    def rollback(self):
        """Rollback current transaction."""
        try:
            self.db.rollback()
            self._logger.debug(f"Transaction rolled back for {self.model_class.__name__}")
        except Exception as e:
            self._logger.error(f"Failed to rollback transaction for {self.model_class.__name__}: {e}")
            raise
    
    def flush(self):
        """Flush changes to database without committing."""
        try:
            self.db.flush()
            self._logger.debug(f"Flushed changes for {self.model_class.__name__}")
        except Exception as e:
            self._logger.error(f"Failed to flush for {self.model_class.__name__}: {e}")
            raise
    
    def refresh(self, instance: T) -> T:
        """Refresh entity from database."""
        try:
            self.db.refresh(instance)
            self._logger.debug(f"Refreshed {self.model_class.__name__} id={instance.id}")
            return instance
        except Exception as e:
            self._logger.error(f"Failed to refresh {self.model_class.__name__}: {e}")
            raise
