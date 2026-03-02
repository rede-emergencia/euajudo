"""
Router para gerenciamento de categorias e metadados
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Category, CategoryAttribute, ProductMetadata, ProductBatch
from app.category_schemas import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryWithHierarchy,
    CategoryAttributeCreate,
    CategoryAttributeUpdate,
    CategoryAttributeResponse
)

router = APIRouter(prefix="/categories", tags=["categories"])

# ============================================================================
# CATEGORY ENDPOINTS
# ============================================================================

@router.get("/", response_model=List[CategoryResponse])
def list_categories(
    active_only: bool = True,
    include_attributes: bool = True,
    db: Session = Depends(get_db)
):
    """
    Lista todas as categorias.
    Por padrão retorna apenas categorias ativas.
    """
    query = db.query(Category)
    
    if active_only:
        query = query.filter(Category.active == True)
    
    categories = query.order_by(Category.sort_order, Category.display_name).all()
    return categories

@router.get("/{category_id}", response_model=CategoryWithHierarchy)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Obtém detalhes de uma categoria específica com hierarquia"""
    category = db.query(Category).filter(Category.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria {category_id} não encontrada"
        )
    
    return category

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Cria uma nova categoria"""
    
    # Verificar se já existe categoria com esse nome
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Categoria com nome '{category.name}' já existe"
        )
    
    # Verificar parent_id se fornecido
    if category.parent_id:
        parent = db.query(Category).filter(Category.id == category.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoria pai {category.parent_id} não encontrada"
            )
    
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma categoria existente"""
    
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria {category_id} não encontrada"
        )
    
    # Atualizar apenas campos fornecidos
    update_data = category_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """
    Deleta uma categoria (soft delete - marca como inativa).
    Não permite deletar se houver produtos associados.
    """
    
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria {category_id} não encontrada"
        )
    
    # Verificar se há produtos usando esta categoria
    batch_count = db.query(ProductBatch).filter(ProductBatch.category_id == category_id).count()
    if batch_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível deletar categoria com {batch_count} produtos associados. Desative-a ao invés disso."
        )
    
    # Soft delete
    db_category.active = False
    db.commit()
    
    return None

# ============================================================================
# CATEGORY ATTRIBUTE ENDPOINTS
# ============================================================================

@router.get("/{category_id}/attributes", response_model=List[CategoryAttributeResponse])
def list_category_attributes(
    category_id: int,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Lista atributos de uma categoria"""
    
    # Verificar se categoria existe
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria {category_id} não encontrada"
        )
    
    query = db.query(CategoryAttribute).filter(CategoryAttribute.category_id == category_id)
    
    if active_only:
        query = query.filter(CategoryAttribute.active == True)
    
    attributes = query.order_by(CategoryAttribute.sort_order, CategoryAttribute.display_name).all()
    return attributes

@router.post("/{category_id}/attributes", response_model=CategoryAttributeResponse, status_code=status.HTTP_201_CREATED)
def create_category_attribute(
    category_id: int,
    attribute: CategoryAttributeCreate,
    db: Session = Depends(get_db)
):
    """Cria um novo atributo para uma categoria"""
    
    # Verificar se categoria existe
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria {category_id} não encontrada"
        )
    
    # Verificar se já existe atributo com esse nome na categoria
    existing = db.query(CategoryAttribute).filter(
        CategoryAttribute.category_id == category_id,
        CategoryAttribute.name == attribute.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Atributo '{attribute.name}' já existe nesta categoria"
        )
    
    # Forçar category_id do path
    attribute_data = attribute.model_dump()
    attribute_data['category_id'] = category_id
    
    db_attribute = CategoryAttribute(**attribute_data)
    db.add(db_attribute)
    db.commit()
    db.refresh(db_attribute)
    
    return db_attribute

@router.patch("/{category_id}/attributes/{attribute_id}", response_model=CategoryAttributeResponse)
def update_category_attribute(
    category_id: int,
    attribute_id: int,
    attribute_update: CategoryAttributeUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza um atributo de categoria"""
    
    db_attribute = db.query(CategoryAttribute).filter(
        CategoryAttribute.id == attribute_id,
        CategoryAttribute.category_id == category_id
    ).first()
    
    if not db_attribute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Atributo {attribute_id} não encontrado na categoria {category_id}"
        )
    
    # Atualizar apenas campos fornecidos
    update_data = attribute_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_attribute, field, value)
    
    db.commit()
    db.refresh(db_attribute)
    
    return db_attribute

@router.delete("/{category_id}/attributes/{attribute_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_attribute(
    category_id: int,
    attribute_id: int,
    db: Session = Depends(get_db)
):
    """
    Deleta um atributo (soft delete).
    Não permite deletar se houver metadados usando este atributo.
    """
    
    db_attribute = db.query(CategoryAttribute).filter(
        CategoryAttribute.id == attribute_id,
        CategoryAttribute.category_id == category_id
    ).first()
    
    if not db_attribute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Atributo {attribute_id} não encontrado"
        )
    
    # Verificar se há metadados usando este atributo
    metadata_count = db.query(ProductMetadata).filter(
        ProductMetadata.attribute_id == attribute_id
    ).count()
    
    if metadata_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível deletar atributo com {metadata_count} valores associados. Desative-o ao invés disso."
        )
    
    # Soft delete
    db_attribute.active = False
    db.commit()
    
    return None

# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/legacy-mapping/{product_type}", response_model=CategoryResponse)
def get_category_by_legacy_type(product_type: str, db: Session = Depends(get_db)):
    """
    Obtém categoria baseada no ProductType legado.
    Útil para compatibilidade com código antigo.
    """
    
    category = db.query(Category).filter(
        Category.legacy_product_type == product_type,
        Category.active == True
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhuma categoria ativa mapeada para ProductType '{product_type}'"
        )
    
    return category
