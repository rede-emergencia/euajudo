"""
Simple Repository Pattern - avoiding code duplication
Professional but not over-engineered
"""
from typing import List, Optional, TypeVar, Generic
from sqlalchemy.orm import Session
from sqlalchemy import desc

T = TypeVar('T')

class BaseRepository(Generic[T]):
    """Base repository with common CRUD operations"""
    
    def __init__(self, model_class: type, db: Session):
        self.model_class = model_class
        self.db = db
    
    def create(self, **kwargs) -> T:
        """Create new entity"""
        instance = self.model_class(**kwargs)
        self.db.add(instance)
        self.db.flush()
        return instance
    
    def get_by_id(self, id: int) -> Optional[T]:
        """Get entity by ID"""
        return self.db.query(self.model_class).filter(self.model_class.id == id).first()
    
    def list_all(self, order_by=None, limit: int = None) -> List[T]:
        """List all entities"""
        query = self.db.query(self.model_class)
        
        if order_by:
            query = query.order_by(order_by)
        else:
            query = query.order_by(desc(self.model_class.created_at))
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def filter_by(self, **filters) -> List[T]:
        """Filter entities"""
        query = self.db.query(self.model_class)
        
        for key, value in filters.items():
            if value is not None:
                query = query.filter(getattr(self.model_class, key) == value)
        
        return query.order_by(desc(self.model_class.created_at)).all()
    
    def update(self, instance: T, **kwargs) -> T:
        """Update entity"""
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        
        self.db.flush()
        return instance
    
    def delete(self, instance_id: int):
        """Delete entity by ID"""
        instance = self.get_by_id(instance_id)
        if instance:
            self.db.delete(instance)
            self.db.flush()
    
    def delete_instance(self, instance: T):
        """Delete entity instance"""
        self.db.delete(instance)
        self.db.flush()
    
    def commit(self):
        """Commit transaction"""
        self.db.commit()
    
    def refresh(self, instance: T):
        """Refresh entity from database"""
        self.db.refresh(instance)
        return instance
