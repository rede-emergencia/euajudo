"""
Helper functions para trabalhar com sistema de categorias e metadados
Facilita a transição do ProductType legado para o novo sistema
"""
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models import Category, CategoryAttribute, ProductBatch, ProductMetadata, Delivery

# ============================================================================
# CATEGORY HELPERS
# ============================================================================

def get_category_by_legacy_type(db: Session, product_type: str) -> Optional[Category]:
    """
    Obtém categoria baseada no ProductType legado.
    Útil para manter compatibilidade com código existente.
    """
    return db.query(Category).filter(
        Category.legacy_product_type == product_type,
        Category.active == True
    ).first()

def get_or_create_category_from_legacy(db: Session, product_type: str) -> Optional[Category]:
    """
    Obtém categoria existente ou retorna None se não encontrar.
    Não cria automaticamente para evitar inconsistências.
    """
    return get_category_by_legacy_type(db, product_type)

def get_category_attributes(db: Session, category_id: int, active_only: bool = True) -> List[CategoryAttribute]:
    """Obtém todos os atributos de uma categoria"""
    query = db.query(CategoryAttribute).filter(CategoryAttribute.category_id == category_id)
    
    if active_only:
        query = query.filter(CategoryAttribute.active == True)
    
    return query.order_by(CategoryAttribute.sort_order).all()

def get_required_attributes(db: Session, category_id: int) -> List[CategoryAttribute]:
    """Obtém apenas atributos obrigatórios de uma categoria"""
    return db.query(CategoryAttribute).filter(
        CategoryAttribute.category_id == category_id,
        CategoryAttribute.required == True,
        CategoryAttribute.active == True
    ).all()

# ============================================================================
# METADATA HELPERS
# ============================================================================

def set_batch_metadata(
    db: Session,
    batch: ProductBatch,
    metadata: Dict[str, str],
    validate: bool = True
) -> ProductBatch:
    """
    Define metadados para um batch.
    
    Args:
        db: Sessão do banco
        batch: ProductBatch a ser atualizado
        metadata: Dict com {attribute_name: value}
        validate: Se True, valida atributos obrigatórios
    
    Returns:
        ProductBatch atualizado
    """
    if not batch.category_id:
        raise ValueError("Batch deve ter category_id definido para usar metadados")
    
    # Validar atributos obrigatórios se solicitado
    if validate:
        required_attrs = get_required_attributes(db, batch.category_id)
        missing = [attr.name for attr in required_attrs if attr.name not in metadata]
        if missing:
            raise ValueError(f"Atributos obrigatórios faltando: {', '.join(missing)}")
    
    # Limpar metadados existentes
    db.query(ProductMetadata).filter(ProductMetadata.batch_id == batch.id).delete()
    
    # Criar novos metadados
    for attr_name, value in metadata.items():
        # Buscar atributo
        attr = db.query(CategoryAttribute).filter(
            CategoryAttribute.category_id == batch.category_id,
            CategoryAttribute.name == attr_name,
            CategoryAttribute.active == True
        ).first()
        
        if not attr:
            if validate:
                raise ValueError(f"Atributo '{attr_name}' não encontrado para esta categoria")
            continue
        
        # Validar valor se for select
        if attr.attribute_type == "select" and attr.options:
            valid_values = [opt["value"] for opt in attr.options]
            if value not in valid_values:
                if validate:
                    raise ValueError(f"Valor '{value}' inválido para atributo '{attr_name}'. Valores válidos: {valid_values}")
                continue
        
        # Criar metadata
        metadata_obj = ProductMetadata(
            batch_id=batch.id,
            attribute_id=attr.id,
            value=value
        )
        db.add(metadata_obj)
    
    # Atualizar cache
    batch.metadata_cache = metadata
    
    db.flush()
    return batch

def get_batch_metadata(batch: ProductBatch) -> Dict[str, str]:
    """
    Obtém metadados de um batch.
    Usa cache se disponível, senão carrega do banco.
    """
    if batch.metadata_cache:
        return batch.metadata_cache
    
    # Carregar do banco se não houver cache
    metadata = {}
    for meta in batch.metadata_values:
        metadata[meta.attribute.name] = meta.value
    
    return metadata

def set_delivery_metadata(
    db: Session,
    delivery: Delivery,
    metadata: Dict[str, str]
) -> Delivery:
    """
    Define metadados para uma delivery (apenas cache).
    Deliveries não têm tabela de metadados, apenas cache JSON.
    """
    delivery.metadata_cache = metadata
    db.flush()
    return delivery

def get_delivery_metadata(delivery: Delivery) -> Dict[str, str]:
    """Obtém metadados de uma delivery"""
    return delivery.metadata_cache or {}

# ============================================================================
# MIGRATION HELPERS
# ============================================================================

def migrate_batch_to_category(
    db: Session,
    batch: ProductBatch,
    metadata: Optional[Dict[str, str]] = None
) -> ProductBatch:
    """
    Migra um batch do sistema legado (ProductType) para o novo sistema (Category).
    
    Args:
        db: Sessão do banco
        batch: ProductBatch a ser migrado
        metadata: Metadados opcionais para o batch
    
    Returns:
        ProductBatch atualizado
    """
    # Buscar categoria correspondente ao ProductType
    category = get_category_by_legacy_type(db, batch.product_type.value)
    
    if not category:
        raise ValueError(f"Nenhuma categoria encontrada para ProductType '{batch.product_type.value}'")
    
    # Atualizar batch
    batch.category_id = category.id
    
    # Adicionar metadados se fornecidos
    if metadata:
        set_batch_metadata(db, batch, metadata, validate=False)
    
    db.flush()
    return batch

def migrate_delivery_to_category(
    db: Session,
    delivery: Delivery,
    metadata: Optional[Dict[str, str]] = None
) -> Delivery:
    """
    Migra uma delivery do sistema legado para o novo sistema.
    """
    # Buscar categoria correspondente ao ProductType
    category = get_category_by_legacy_type(db, delivery.product_type.value)
    
    if not category:
        raise ValueError(f"Nenhuma categoria encontrada para ProductType '{delivery.product_type.value}'")
    
    # Atualizar delivery
    delivery.category_id = category.id
    
    # Adicionar metadados se fornecidos
    if metadata:
        set_delivery_metadata(db, delivery, metadata)
    
    db.flush()
    return delivery

# ============================================================================
# VALIDATION HELPERS
# ============================================================================

def validate_metadata(
    db: Session,
    category_id: int,
    metadata: Dict[str, str]
) -> tuple[bool, List[str]]:
    """
    Valida metadados contra os atributos de uma categoria.
    
    Returns:
        (is_valid, error_messages)
    """
    errors = []
    
    # Verificar atributos obrigatórios
    required_attrs = get_required_attributes(db, category_id)
    for attr in required_attrs:
        if attr.name not in metadata:
            errors.append(f"Atributo obrigatório '{attr.display_name}' não fornecido")
    
    # Validar cada metadado fornecido
    for attr_name, value in metadata.items():
        attr = db.query(CategoryAttribute).filter(
            CategoryAttribute.category_id == category_id,
            CategoryAttribute.name == attr_name,
            CategoryAttribute.active == True
        ).first()
        
        if not attr:
            errors.append(f"Atributo '{attr_name}' não existe para esta categoria")
            continue
        
        # Validar tipo select
        if attr.attribute_type == "select" and attr.options:
            valid_values = [opt["value"] for opt in attr.options]
            if value not in valid_values:
                errors.append(f"Valor '{value}' inválido para '{attr.display_name}'. Valores válidos: {valid_values}")
        
        # Validar tipo number
        elif attr.attribute_type == "number":
            try:
                num_value = float(value)
                if attr.min_value is not None and num_value < attr.min_value:
                    errors.append(f"Valor de '{attr.display_name}' deve ser >= {attr.min_value}")
                if attr.max_value is not None and num_value > attr.max_value:
                    errors.append(f"Valor de '{attr.display_name}' deve ser <= {attr.max_value}")
            except ValueError:
                errors.append(f"Valor de '{attr.display_name}' deve ser numérico")
        
        # Validar tipo text
        elif attr.attribute_type == "text":
            if attr.max_length and len(value) > attr.max_length:
                errors.append(f"Valor de '{attr.display_name}' excede tamanho máximo de {attr.max_length} caracteres")
    
    return (len(errors) == 0, errors)

def format_metadata_for_display(
    db: Session,
    category_id: int,
    metadata: Dict[str, str]
) -> Dict[str, str]:
    """
    Formata metadados para exibição, convertendo valores internos em labels amigáveis.
    
    Returns:
        Dict com {display_name: display_value}
    """
    formatted = {}
    
    for attr_name, value in metadata.items():
        attr = db.query(CategoryAttribute).filter(
            CategoryAttribute.category_id == category_id,
            CategoryAttribute.name == attr_name
        ).first()
        
        if not attr:
            continue
        
        # Para select, buscar label
        if attr.attribute_type == "select" and attr.options:
            for opt in attr.options:
                if opt["value"] == value:
                    formatted[attr.display_name] = opt["label"]
                    break
            else:
                formatted[attr.display_name] = value
        else:
            formatted[attr.display_name] = value
    
    return formatted
