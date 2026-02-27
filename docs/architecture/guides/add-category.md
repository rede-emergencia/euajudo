# 🚀 Quick Start: Adicionar Nova Categoria

Este guia mostra como adicionar uma nova categoria ao sistema em **menos de 2 horas**.

## Exemplo: Adicionar categoria "Móveis"

### Passo 1: Criar Plugin (30 min)

```bash
# Criar estrutura
mkdir -p app/plugins/furniture
touch app/plugins/furniture/{__init__.py,plugin.py,validators.py,schemas.py}
```

```python
# app/plugins/furniture/schemas.py
from pydantic import BaseModel, validator
from typing import Optional, Dict

class FurnitureMetadataSchema(BaseModel):
    """Schema para móveis"""
    tipo: str  # "cama", "mesa", "cadeira", "guarda_roupa"
    estado: str  # "novo", "usado_bom", "usado_regular"
    dimensoes: Dict[str, float]  # {"largura": 1.5, "altura": 2.0, "profundidade": 0.6}
    quantidade: int
    precisa_montagem: Optional[bool] = False
    precisa_transporte_especial: Optional[bool] = False
    
    @validator('tipo')
    def tipo_valido(cls, v):
        valid = ["cama", "mesa", "cadeira", "guarda_roupa", "sofa", "estante", "colchao"]
        if v not in valid:
            raise ValueError(f"Tipo deve ser um de: {valid}")
        return v
    
    @validator('estado')
    def estado_valido(cls, v):
        valid = ["novo", "usado_bom", "usado_regular"]
        if v not in valid:
            raise ValueError(f"Estado deve ser um de: {valid}")
        return v
    
    @validator('quantidade')
    def quantidade_positiva(cls, v):
        if v <= 0:
            raise ValueError("Quantidade deve ser maior que zero")
        return v

# app/plugins/furniture/plugin.py
from app.core.interfaces.plugin import CategoryPlugin
from app.core.domain.entities import Event
from .schemas import FurnitureMetadataSchema
from pydantic import ValidationError

class FurniturePlugin(CategoryPlugin):
    """Plugin para categoria de móveis"""
    
    category = "moveis"
    subcategories = ["quarto", "sala", "cozinha", "escritorio"]
    
    def validate_metadata(self, metadata: Dict[str, Any]) -> None:
        """Valida metadata de móveis"""
        try:
            FurnitureMetadataSchema(**metadata)
        except ValidationError as e:
            raise DomainValidationError(f"Metadata inválido: {e}")
    
    def enrich_event(self, event: Event) -> Event:
        """Enriquece evento de móveis"""
        
        # Calcular volume aproximado
        if "dimensoes" in event.metadata:
            dim = event.metadata["dimensoes"]
            volume = dim.get("largura", 0) * dim.get("altura", 0) * dim.get("profundidade", 0)
            event.metadata["volume_m3"] = round(volume, 2)
        
        # Classificar urgência
        if event.metadata.get("tipo") in ["cama", "colchao"]:
            event.metadata["urgencia"] = "alta"
        else:
            event.metadata["urgencia"] = "media"
        
        # Adicionar tags
        tags = [event.metadata["tipo"], event.metadata["estado"]]
        if event.metadata.get("precisa_transporte_especial"):
            tags.append("transporte_especial")
        event.metadata["tags"] = tags
        
        return event
    
    def calculate_match_score(
        self,
        need: Event,
        offer: Event,
        base_score: float
    ) -> float:
        """Ajusta score para móveis"""
        
        score = base_score
        
        # Bonus: tipo de móvel igual
        if need.metadata.get("tipo") == offer.metadata.get("tipo"):
            score += 20
        
        # Bonus: estado compatível
        need_estado = need.metadata.get("estado")
        offer_estado = offer.metadata.get("estado")
        
        if need_estado == offer_estado:
            score += 10
        elif need_estado == "usado_regular" and offer_estado in ["usado_bom", "novo"]:
            score += 5  # Oferta melhor que necessidade
        
        # Penalidade: precisa transporte especial mas não tem
        if (need.metadata.get("precisa_transporte_especial") and 
            not offer.metadata.get("precisa_transporte_especial")):
            score -= 15
        
        return score
    
    def get_display_fields(self, event: Event) -> Dict[str, Any]:
        """Campos para UI"""
        tipo = event.metadata.get("tipo", "móvel")
        quantidade = event.metadata.get("quantidade", 1)
        estado = event.metadata.get("estado", "")
        
        return {
            "icon": "🛋️",
            "title": f"{quantidade} {tipo}{'s' if quantidade > 1 else ''}",
            "subtitle": f"Estado: {estado.replace('_', ' ').title()}",
            "details": self._get_details(event)
        }
    
    def _get_details(self, event: Event) -> List[str]:
        """Detalhes adicionais"""
        details = []
        
        if "dimensoes" in event.metadata:
            dim = event.metadata["dimensoes"]
            details.append(
                f"📏 {dim.get('largura')}m x {dim.get('altura')}m x {dim.get('profundidade')}m"
            )
        
        if event.metadata.get("precisa_montagem"):
            details.append("🔧 Precisa montagem")
        
        if event.metadata.get("precisa_transporte_especial"):
            details.append("🚚 Transporte especial necessário")
        
        return details
```

### Passo 2: Registrar Plugin (5 min)

```python
# app/plugins/registry.py
from .furniture.plugin import FurniturePlugin

def register_all_plugins():
    """Registra todos os plugins disponíveis"""
    plugin_registry.register(FoodPlugin())
    plugin_registry.register(ClothingPlugin())
    plugin_registry.register(MedicinePlugin())
    plugin_registry.register(FurniturePlugin())  # ← ADICIONAR
```

### Passo 3: Criar Testes (30 min)

```python
# tests/plugins/test_furniture_plugin.py
import pytest
from app.plugins.furniture.plugin import FurniturePlugin
from app.core.domain.entities import Event

def test_furniture_plugin_validates_metadata():
    """Testa validação de metadata"""
    plugin = FurniturePlugin()
    
    # Válido
    valid_metadata = {
        "tipo": "cama",
        "estado": "novo",
        "dimensoes": {"largura": 1.5, "altura": 2.0, "profundidade": 0.6},
        "quantidade": 2
    }
    plugin.validate_metadata(valid_metadata)  # Não deve lançar erro
    
    # Inválido - tipo errado
    invalid_metadata = {
        "tipo": "mesa_de_sinuca",  # Tipo não existe
        "estado": "novo",
        "quantidade": 1
    }
    
    with pytest.raises(ValidationError):
        plugin.validate_metadata(invalid_metadata)

def test_furniture_plugin_enriches_event():
    """Testa enriquecimento de evento"""
    plugin = FurniturePlugin()
    
    event = Event(
        category="moveis",
        metadata={
            "tipo": "cama",
            "estado": "novo",
            "dimensoes": {"largura": 2.0, "altura": 1.0, "profundidade": 1.5},
            "quantidade": 1
        }
    )
    
    enriched = plugin.enrich_event(event)
    
    # Deve calcular volume
    assert "volume_m3" in enriched.metadata
    assert enriched.metadata["volume_m3"] == 3.0  # 2.0 * 1.0 * 1.5
    
    # Cama é urgente
    assert enriched.metadata["urgencia"] == "alta"
    
    # Deve ter tags
    assert "tags" in enriched.metadata
    assert "cama" in enriched.metadata["tags"]

def test_furniture_matching_score():
    """Testa score de matching"""
    plugin = FurniturePlugin()
    
    need = Event(
        category="moveis",
        metadata={"tipo": "cama", "estado": "usado_bom", "quantidade": 1}
    )
    
    offer_perfeita = Event(
        category="moveis",
        metadata={"tipo": "cama", "estado": "usado_bom", "quantidade": 1}
    )
    
    offer_melhor = Event(
        category="moveis",
        metadata={"tipo": "cama", "estado": "novo", "quantidade": 1}
    )
    
    offer_diferente = Event(
        category="moveis",
        metadata={"tipo": "mesa", "estado": "usado_bom", "quantidade": 1}
    )
    
    base_score = 50
    
    # Oferta perfeita deve ter score maior
    score_perfeita = plugin.calculate_match_score(need, offer_perfeita, base_score)
    assert score_perfeita == 80  # 50 + 20 (tipo) + 10 (estado)
    
    # Oferta melhor que necessidade
    score_melhor = plugin.calculate_match_score(need, offer_melhor, base_score)
    assert score_melhor == 70  # 50 + 20 (tipo)
    
    # Tipo diferente não tem bonus
    score_diferente = plugin.calculate_match_score(need, offer_diferente, base_score)
    assert score_diferente == 60  # 50 + 10 (estado)
```

### Passo 4: Testar Manualmente (15 min)

```bash
# Rodar testes
pytest tests/plugins/test_furniture_plugin.py -v

# Testar API
curl -X POST http://localhost:8000/api/v2/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "necessidade",
    "category": "moveis",
    "metadata": {
      "tipo": "cama",
      "estado": "usado_bom",
      "dimensoes": {"largura": 1.5, "altura": 2.0, "profundidade": 0.6},
      "quantidade": 2
    },
    "items": [
      {
        "name": "Cama de solteiro",
        "quantity": 2,
        "unit": "unidades"
      }
    ]
  }'
```

### Passo 5: Documentar (10 min)

```markdown
# docs/categories/moveis.md

# Categoria: Móveis

## Metadata Obrigatório

- `tipo`: Tipo de móvel (cama, mesa, cadeira, etc.)
- `estado`: Estado de conservação (novo, usado_bom, usado_regular)
- `quantidade`: Quantidade de móveis
- `dimensoes`: Dimensões em metros (largura, altura, profundidade)

## Metadata Opcional

- `precisa_montagem`: Se precisa montagem (boolean)
- `precisa_transporte_especial`: Se precisa transporte especial (boolean)

## Exemplo

```json
{
  "tipo": "cama",
  "estado": "novo",
  "dimensoes": {
    "largura": 1.5,
    "altura": 2.0,
    "profundidade": 0.6
  },
  "quantidade": 2,
  "precisa_montagem": true
}
```
```

### Passo 6: Deploy (10 min)

```bash
# Commit
git add app/plugins/furniture tests/plugins/test_furniture_plugin.py
git commit -m "feat: adicionar categoria móveis"

# Push
git push origin main

# Deploy automático via CI/CD
# ou manual:
docker-compose build
docker-compose up -d
```

## Checklist

- [ ] Plugin criado com schema de validação
- [ ] Método `validate_metadata()` implementado
- [ ] Método `enrich_event()` implementado
- [ ] Método `calculate_match_score()` implementado
- [ ] Método `get_display_fields()` implementado
- [ ] Plugin registrado no registry
- [ ] Testes unitários criados (mínimo 3)
- [ ] Testes passando
- [ ] Testado manualmente via API
- [ ] Documentação criada
- [ ] Commit e deploy

## Tempo Total Estimado

- Plugin: 30 min
- Registro: 5 min
- Testes: 30 min
- Teste manual: 15 min
- Documentação: 10 min
- Deploy: 10 min

**Total: ~1h40min**

## Troubleshooting

### Erro: "Plugin não encontrado"
```python
# Verificar se registrou no registry.py
plugin_registry.register(FurniturePlugin())

# Verificar se app foi reiniciado
# Verificar logs de startup
```

### Erro: "Validation error"
```python
# Verificar schema Pydantic
# Verificar campos obrigatórios
# Verificar tipos de dados
```

### Matching não funciona
```python
# Verificar categoria igual em need e offer
# Verificar método calculate_match_score()
# Verificar base_score > 0
```

---

**Próximo**: [Como Implementar um Plugin](./plugin-development.md)
