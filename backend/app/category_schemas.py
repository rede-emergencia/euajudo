"""
Schemas para sistema de categorias e metadados
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============================================================================
# CATEGORY SCHEMAS
# ============================================================================

class CategoryAttributeOptionBase(BaseModel):
    value: str
    label: str

class CategoryAttributeBase(BaseModel):
    name: str = Field(..., description="Nome interno do atributo", example="tamanho")
    display_name: str = Field(..., description="Nome exibido", example="Tamanho")
    attribute_type: str = Field(default="select", description="Tipo: select, text, number, boolean")
    required: bool = Field(default=False)
    sort_order: int = Field(default=0)
    options: Optional[List[Dict[str, str]]] = Field(None, description="Opções para tipo select")
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    max_length: Optional[int] = None

class CategoryAttributeCreate(CategoryAttributeBase):
    category_id: int

class CategoryAttributeUpdate(BaseModel):
    display_name: Optional[str] = None
    required: Optional[bool] = None
    options: Optional[List[Dict[str, str]]] = None
    active: Optional[bool] = None

class CategoryAttributeResponse(CategoryAttributeBase):
    id: int
    category_id: int
    active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# CATEGORY SCHEMAS
# ============================================================================

class CategoryBase(BaseModel):
    name: str = Field(..., description="Nome interno único", example="roupa_crianca")
    display_name: str = Field(..., description="Nome exibido", example="Roupas de Criança")
    description: Optional[str] = None
    icon: Optional[str] = Field(None, description="Emoji ou nome do ícone", example="👕")
    color: Optional[str] = Field(None, description="Cor hex", example="#FF5733")
    parent_id: Optional[int] = None
    sort_order: int = Field(default=0)
    legacy_product_type: Optional[str] = Field(None, description="Mapeamento para ProductType legado")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    active: Optional[bool] = None

class CategoryResponse(CategoryBase):
    id: int
    active: bool
    created_at: datetime
    attributes: List[CategoryAttributeResponse] = []
    
    class Config:
        from_attributes = True

class CategoryWithHierarchy(CategoryResponse):
    """Categoria com informações de hierarquia"""
    parent: Optional['CategoryResponse'] = None
    children: List['CategoryResponse'] = []

# ============================================================================
# PRODUCT METADATA SCHEMAS
# ============================================================================

class ProductMetadataBase(BaseModel):
    attribute_id: int
    value: str

class ProductMetadataCreate(ProductMetadataBase):
    batch_id: int

class ProductMetadataResponse(ProductMetadataBase):
    id: int
    batch_id: int
    created_at: datetime
    attribute: CategoryAttributeResponse
    
    class Config:
        from_attributes = True

# ============================================================================
# BATCH WITH METADATA
# ============================================================================

class BatchMetadataInput(BaseModel):
    """Input para criar batch com metadados"""
    category_id: Optional[int] = None
    metadata: Optional[Dict[str, str]] = Field(None, description="Metadados como dict", example={"tamanho": "P", "genero": "U"})

class BatchWithMetadataResponse(BaseModel):
    """Batch com metadados expandidos"""
    id: int
    product_type: str
    category_id: Optional[int] = None
    category: Optional[CategoryResponse] = None
    quantity: int
    quantity_available: int
    description: Optional[str] = None
    metadata_cache: Optional[Dict[str, str]] = None
    metadata_values: List[ProductMetadataResponse] = []
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# DELIVERY WITH METADATA
# ============================================================================

class DeliveryWithMetadataResponse(BaseModel):
    """Delivery com metadados expandidos"""
    id: int
    product_type: str
    category_id: Optional[int] = None
    category: Optional[CategoryResponse] = None
    quantity: int
    metadata_cache: Optional[Dict[str, str]] = None
    status: str
    location_id: int
    volunteer_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
