"""
UserRepository - Data access for User entities.

Domain-specific queries:
  - find_by_email: unique user lookup
  - find_by_role: filter users by role
  - find_approved: get approved users
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import User
from .base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User entities with domain-specific queries."""
    
    def __init__(self, db: Session):
        super().__init__(User, db)
    
    def find_by_email(self, email: str) -> Optional[User]:
        """
        Find user by email (unique).
        
        Args:
            email: User's email address
        
        Returns:
            User or None
        """
        result = (
            self.db.query(User)
            .filter(User.email == email)
            .first()
        )
        
        self._logger.debug(f"Lookup user by email, found={result is not None}")
        return result
    
    def find_by_role(self, role: str, approved_only: bool = False) -> List[User]:
        """
        Find all users with a specific role.
        
        Args:
            role: Role name (volunteer, shelter, provider)
            approved_only: If True, only approved users
        
        Returns:
            List of users with the role
        """
        query = self.db.query(User).filter(User.roles.contains(role))
        
        if approved_only:
            query = query.filter(User.approved == True)
        
        result = query.all()
        self._logger.debug(
            f"Found {len(result)} users with role={role} (approved_only={approved_only})"
        )
        return result
    
    def find_approved(self, active_only: bool = True) -> List[User]:
        """
        Find all approved users.
        
        Args:
            active_only: If True, only active users
        
        Returns:
            List of approved users
        """
        query = self.db.query(User).filter(User.approved == True)
        
        if active_only:
            query = query.filter(User.active == True)
        
        result = query.all()
        self._logger.debug(
            f"Found {len(result)} approved users (active_only={active_only})"
        )
        return result
    
    def exists_by_email(self, email: str) -> bool:
        """
        Check if user exists by email.
        
        Args:
            email: Email to check
        
        Returns:
            True if user exists
        """
        result = (
            self.db.query(User.id)
            .filter(User.email == email)
            .first()
        ) is not None
        
        self._logger.debug(f"User exists with email={email}: {result}")
        return result
