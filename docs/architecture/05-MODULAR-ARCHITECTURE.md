# 🧩 Arquitetura Modular e Sistema de Plugins

## Conceito

Sistema **modular** onde cada categoria de produto/serviço é um **plugin independente** que estende o core genérico.

## Estrutura de Diretórios

```
backend/
├── app/
│   ├── core/                      # Core genérico (nunca muda)
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── event.py
│   │   │   │   ├── assignment.py
│   │   │   │   └── delivery.py
│   │   │   ├── value_objects/
│   │   │   │   ├── location.py
│   │   │   │   ├── quantity.py
│   │   │   │   └── timeframe.py
│   │   │   └── services/
│   │   │       ├── matching.py
│   │   │       └── routing.py
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   └── handlers/
│   │   ├── infrastructure/
│   │   │   ├── database/
│   │   │   ├── events/
│   │   │   └── repositories/
│   │   └── interfaces/
│   │       ├── plugin.py         # Interface de plugin
│   │       └── validator.py
│   │
│   ├── plugins/                   # Plugins por categoria
│   │   ├── food/                  # Plugin de alimentos
│   │   │   ├── __init__.py
│   │   │   ├── plugin.py
│   │   │   ├── validators.py
│   │   │   ├── enrichers.py
│   │   │   ├── matchers.py
│   │   │   └── schemas.py
│   │   │
│   │   ├── clothing/              # Plugin de roupas
│   │   │   ├── __init__.py
│   │   │   ├── plugin.py
│   │   │   ├── validators.py
│   │   │   └── schemas.py
│   │   │
│   │   ├── medicine/              # Plugin de medicamentos
│   │   │   └── ...
│   │   │
│   │   └── registry.py            # Registro de plugins
│   │
│   └── api/                       # APIs genéricas
│       ├── v1/
│       │   └── events.py          # Endpoints genéricos
│       └── v2/
│           └── events.py
```

## Interface de Plugin

```python
# app/core/interfaces/plugin.py
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any

class CategoryPlugin(ABC):
    """Interface que todo plugin deve implementar"""
    
    @property
    @abstractmethod
    def category(self) -> str:
        """Nome da categoria (ex: 'alimentos', 'roupas')"""
        pass
    
    @property
    def subcategories(self) -> List[str]:
        """Subcategorias suportadas"""
        return []
    
    @abstractmethod
    def validate_metadata(self, metadata: Dict[str, Any]) -> None:
        """
        Valida metadata específica da categoria
        Raises: ValidationError se inválido
        """
        pass
    
    @abstractmethod
    def enrich_event(self, event: Event) -> Event:
        """
        Enriquece evento com informações específicas
        Ex: calcular totais, normalizar dados
        """
        pass
    
    def calculate_match_score(
        self,
        need: Event,
        offer: Event,
        base_score: float
    ) -> float:
        """
        Modifica score de matching baseado em regras específicas
        """
        return base_score
    
    def get_display_fields(self, event: Event) -> Dict[str, Any]:
        """
        Retorna campos para exibição no frontend
        """
        return {}
    
    def get_search_fields(self, event: Event) -> List[str]:
        """
        Campos indexáveis para busca
        """
        return []
    
    def on_event_created(self, event: Event) -> None:
        """Hook executado quando evento é criado"""
        pass
    
    def on_event_completed(self, event: Event) -> None:
        """Hook executado quando evento é completado"""
        pass
```

## Implementação de Plugin: Food

```python
# app/plugins/food/plugin.py
from app.core.interfaces.plugin import CategoryPlugin
from app.core.domain.entities import Event
from .validators import FoodMetadataValidator
from .enrichers import FoodEventEnricher
from .matchers import FoodMatchScorer

class FoodPlugin(CategoryPlugin):
    """Plugin para categoria de alimentos"""
    
    category = "alimentos"
    subcategories = ["marmitas", "cestas_basicas", "refeicoes", "lanches"]
    
    def __init__(self):
        self.validator = FoodMetadataValidator()
        self.enricher = FoodEventEnricher()
        self.scorer = FoodMatchScorer()
    
    def validate_metadata(self, metadata: Dict[str, Any]) -> None:
        """Validações específicas para alimentos"""
        self.validator.validate(metadata)
    
    def enrich_event(self, event: Event) -> Event:
        """Enriquece evento de alimentos"""
        return self.enricher.enrich(event)
    
    def calculate_match_score(
        self,
        need: Event,
        offer: Event,
        base_score: float
    ) -> float:
        """Ajusta score baseado em preferências alimentares"""
        return self.scorer.adjust_score(need, offer, base_score)
    
    def get_display_fields(self, event: Event) -> Dict[str, Any]:
        """Campos para UI"""
        return {
            "icon": "🍱",
            "title": self._get_title(event),
            "subtitle": self._get_subtitle(event),
            "details": self._get_details(event)
        }
    
    def _get_title(self, event: Event) -> str:
        qty = event.metadata.get("quantidade", 0)
        tipo = event.metadata.get("tipo_refeicao", "refeição")
        return f"{qty} {tipo}{'s' if qty > 1 else ''}"
    
    def _get_subtitle(self, event: Event) -> str:
        horario = event.metadata.get("horario_entrega", "")
        return f"Entrega: {horario}"
    
    def _get_details(self, event: Event) -> List[str]:
        details = []
        
        if event.metadata.get("vegetariana"):
            details.append("🌱 Vegetariana")
        
        if event.metadata.get("sem_gluten"):
            details.append("🌾 Sem glúten")
        
        return details

# app/plugins/food/validators.py
from pydantic import BaseModel, validator
from typing import Optional

class FoodMetadataSchema(BaseModel):
    """Schema para validação de metadata de alimentos"""
    
    quantidade: int
    tipo_refeicao: str
    horario_entrega: Optional[str] = None
    vegetariana: Optional[bool] = False
    sem_gluten: Optional[bool] = False
    sem_lactose: Optional[bool] = False
    
    @validator('quantidade')
    def quantidade_positiva(cls, v):
        if v <= 0:
            raise ValueError("Quantidade deve ser maior que zero")
        return v
    
    @validator('tipo_refeicao')
    def tipo_valido(cls, v):
        valid = ["cafe_manha", "almoco", "jantar", "lanche", "ceia"]
        if v not in valid:
            raise ValueError(f"Tipo deve ser um de: {valid}")
        return v

class FoodMetadataValidator:
    def validate(self, metadata: Dict[str, Any]) -> None:
        """Valida metadata usando Pydantic"""
        try:
            FoodMetadataSchema(**metadata)
        except ValidationError as e:
            raise DomainValidationError(f"Metadata inválido: {e}")

# app/plugins/food/enrichers.py
class FoodEventEnricher:
    """Enriquece eventos de alimentos"""
    
    def enrich(self, event: Event) -> Event:
        """Adiciona informações derivadas"""
        
        # Calcular total de porções
        event.metadata["total_porcoes"] = self._calculate_portions(event)
        
        # Classificar urgência baseado em perecibilidade
        event.metadata["urgencia"] = self._classify_urgency(event)
        
        # Adicionar tags para busca
        event.metadata["tags"] = self._generate_tags(event)
        
        return event
    
    def _calculate_portions(self, event: Event) -> int:
        """Calcula total de porções"""
        return event.metadata.get("quantidade", 0)
    
    def _classify_urgency(self, event: Event) -> str:
        """Classifica urgência"""
        # Alimentos prontos são urgentes
        if event.metadata.get("tipo_refeicao") in ["almoco", "jantar"]:
            return "alta"
        return "media"
    
    def _generate_tags(self, event: Event) -> List[str]:
        """Gera tags para busca"""
        tags = [event.metadata.get("tipo_refeicao")]
        
        if event.metadata.get("vegetariana"):
            tags.append("vegetariana")
        
        if event.metadata.get("sem_gluten"):
            tags.append("sem_gluten")
        
        return tags

# app/plugins/food/matchers.py
class FoodMatchScorer:
    """Ajusta score de matching para alimentos"""
    
    def adjust_score(
        self,
        need: Event,
        offer: Event,
        base_score: float
    ) -> float:
        """Ajusta score baseado em preferências"""
        
        score = base_score
        
        # Bonus: restrições alimentares compatíveis
        if self._dietary_match(need, offer):
            score += 10
        
        # Bonus: tipo de refeição igual
        if need.metadata.get("tipo_refeicao") == offer.metadata.get("tipo_refeicao"):
            score += 5
        
        # Penalidade: incompatibilidade
        if self._dietary_mismatch(need, offer):
            score -= 20
        
        return score
    
    def _dietary_match(self, need: Event, offer: Event) -> bool:
        """Verifica compatibilidade de restrições"""
        restrictions = ["vegetariana", "sem_gluten", "sem_lactose"]
        
        for restriction in restrictions:
            if need.metadata.get(restriction) and offer.metadata.get(restriction):
                return True
        
        return False
    
    def _dietary_mismatch(self, need: Event, offer: Event) -> bool:
        """Verifica incompatibilidade"""
        # Necessidade vegetariana mas oferta não é
        if need.metadata.get("vegetariana") and not offer.metadata.get("vegetariana"):
            return True
        
        return False
```

## Implementação de Plugin: Clothing

```python
# app/plugins/clothing/plugin.py
class ClothingPlugin(CategoryPlugin):
    """Plugin para categoria de roupas"""
    
    category = "roupas"
    subcategories = ["inverno", "verao", "uniforme", "crianca", "bebe"]
    
    def validate_metadata(self, metadata: Dict[str, Any]) -> None:
        """Validações específicas para roupas"""
        required = ["tamanhos", "genero", "estacao"]
        
        for field in required:
            if field not in metadata:
                raise ValidationError(f"Campo '{field}' obrigatório")
        
        # Validar tamanhos
        valid_sizes = ["RN", "P", "M", "G", "GG", "XG", "1", "2", "4", "6", "8", "10", "12", "14", "16"]
        tamanhos = metadata["tamanhos"]
        
        if isinstance(tamanhos, dict):
            for size in tamanhos.keys():
                if size not in valid_sizes:
                    raise ValidationError(f"Tamanho inválido: {size}")
        
        # Validar gênero
        valid_genero = ["masculino", "feminino", "unissex", "infantil"]
        if metadata["genero"] not in valid_genero:
            raise ValidationError(f"Gênero deve ser um de: {valid_genero}")
        
        # Validar estação
        valid_estacao = ["verao", "inverno", "meia_estacao", "todas"]
        if metadata["estacao"] not in valid_estacao:
            raise ValidationError(f"Estação deve ser uma de: {valid_estacao}")
    
    def enrich_event(self, event: Event) -> Event:
        """Enriquece evento de roupas"""
        
        # Calcular total de peças
        if isinstance(event.metadata["tamanhos"], dict):
            total = sum(event.metadata["tamanhos"].values())
            event.metadata["total_pecas"] = total
        
        # Classificar urgência baseado em estação
        if event.metadata["estacao"] == "inverno":
            event.metadata["urgencia"] = "alta"
        else:
            event.metadata["urgencia"] = "media"
        
        # Tags para busca
        event.metadata["tags"] = [
            event.metadata["genero"],
            event.metadata["estacao"],
            f"tamanhos_{len(event.metadata['tamanhos'])}"
        ]
        
        return event
    
    def calculate_match_score(
        self,
        need: Event,
        offer: Event,
        base_score: float
    ) -> float:
        """Ajusta score para roupas"""
        
        score = base_score
        
        # Bonus: estação compatível
        if need.metadata["estacao"] == offer.metadata["estacao"]:
            score += 15
        
        # Bonus: gênero compatível ou unissex
        need_genero = need.metadata["genero"]
        offer_genero = offer.metadata["genero"]
        
        if need_genero == offer_genero or offer_genero == "unissex":
            score += 10
        
        # Bonus: tamanhos sobrepostos
        overlap = self._size_overlap(
            need.metadata["tamanhos"],
            offer.metadata["tamanhos"]
        )
        score += overlap * 5
        
        return score
    
    def _size_overlap(self, need_sizes: Dict, offer_sizes: Dict) -> int:
        """Conta quantos tamanhos em comum"""
        need_set = set(need_sizes.keys())
        offer_set = set(offer_sizes.keys())
        return len(need_set & offer_set)
    
    def get_display_fields(self, event: Event) -> Dict[str, Any]:
        """Campos para UI"""
        return {
            "icon": "👕",
            "title": f"{event.metadata['total_pecas']} peças de roupa",
            "subtitle": f"{event.metadata['genero'].capitalize()} - {event.metadata['estacao'].capitalize()}",
            "details": [
                f"Tamanhos: {', '.join(event.metadata['tamanhos'].keys())}"
            ]
        }
```

## Registry de Plugins

```python
# app/plugins/registry.py
from typing import Dict, Type
from app.core.interfaces.plugin import CategoryPlugin
from .food.plugin import FoodPlugin
from .clothing.plugin import ClothingPlugin
from .medicine.plugin import MedicinePlugin

class PluginRegistry:
    """Registro central de plugins"""
    
    _instance = None
    _plugins: Dict[str, CategoryPlugin] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def register(self, plugin: CategoryPlugin) -> None:
        """Registra um plugin"""
        self._plugins[plugin.category] = plugin
    
    def get(self, category: str) -> CategoryPlugin:
        """Retorna plugin para categoria"""
        if category not in self._plugins:
            raise ValueError(f"Plugin não encontrado para categoria: {category}")
        return self._plugins[category]
    
    def get_all(self) -> Dict[str, CategoryPlugin]:
        """Retorna todos os plugins"""
        return self._plugins
    
    def list_categories(self) -> List[str]:
        """Lista categorias disponíveis"""
        return list(self._plugins.keys())

# Singleton global
plugin_registry = PluginRegistry()

# Registrar plugins no startup
def register_all_plugins():
    """Registra todos os plugins disponíveis"""
    plugin_registry.register(FoodPlugin())
    plugin_registry.register(ClothingPlugin())
    plugin_registry.register(MedicinePlugin())

# app/main.py
from app.plugins.registry import register_all_plugins

@app.on_event("startup")
async def startup():
    register_all_plugins()
```

## Uso em Endpoints

```python
# app/api/v2/events.py
from app.plugins.registry import plugin_registry

@router.post("/events", response_model=EventResponse)
async def criar_event(data: EventCreate):
    """Endpoint genérico que usa plugins"""
    
    # 1. Obter plugin para categoria
    plugin = plugin_registry.get(data.category)
    
    # 2. Validar metadata específica
    plugin.validate_metadata(data.metadata)
    
    # 3. Criar evento
    event = Event(**data.dict())
    
    # 4. Enriquecer com plugin
    event = plugin.enrich_event(event)
    
    # 5. Salvar
    db.add(event)
    db.commit()
    
    # 6. Hook de plugin
    plugin.on_event_created(event)
    
    return event

@router.get("/events/{event_id}")
async def get_event(event_id: int):
    """Retorna evento com campos de display do plugin"""
    
    event = db.get(Event, event_id)
    
    # Usar plugin para formatar display
    plugin = plugin_registry.get(event.category)
    display_fields = plugin.get_display_fields(event)
    
    return {
        **event.dict(),
        "display": display_fields
    }
```

## Testes de Plugins

```python
# tests/plugins/test_food_plugin.py
import pytest
from app.plugins.food.plugin import FoodPlugin
from app.core.domain.entities import Event

def test_food_plugin_validates_metadata():
    plugin = FoodPlugin()
    
    # Válido
    valid_metadata = {
        "quantidade": 100,
        "tipo_refeicao": "almoco",
        "vegetariana": True
    }
    plugin.validate_metadata(valid_metadata)  # Não deve lançar erro
    
    # Inválido
    invalid_metadata = {
        "quantidade": -5,  # Negativo
        "tipo_refeicao": "almoco"
    }
    
    with pytest.raises(ValidationError):
        plugin.validate_metadata(invalid_metadata)

def test_food_plugin_enriches_event():
    plugin = FoodPlugin()
    
    event = Event(
        category="alimentos",
        metadata={
            "quantidade": 50,
            "tipo_refeicao": "almoco"
        }
    )
    
    enriched = plugin.enrich_event(event)
    
    assert "total_porcoes" in enriched.metadata
    assert enriched.metadata["total_porcoes"] == 50
    assert "urgencia" in enriched.metadata
```

## Adicionar Novo Plugin

```bash
# 1. Criar estrutura
mkdir -p app/plugins/furniture
touch app/plugins/furniture/__init__.py
touch app/plugins/furniture/plugin.py
touch app/plugins/furniture/validators.py

# 2. Implementar plugin
# app/plugins/furniture/plugin.py
class FurniturePlugin(CategoryPlugin):
    category = "moveis"
    
    def validate_metadata(self, metadata):
        # Suas validações
        pass
    
    def enrich_event(self, event):
        # Seu enrichment
        return event

# 3. Registrar
# app/plugins/registry.py
from .furniture.plugin import FurniturePlugin

def register_all_plugins():
    # ...
    plugin_registry.register(FurniturePlugin())

# 4. Testar
# tests/plugins/test_furniture_plugin.py
# Seus testes

# 5. Deploy
# Plugin ativo automaticamente!
```

## Benefícios da Arquitetura Modular

### ✅ Extensibilidade
- Adicionar categorias sem alterar core
- Plugins isolados e independentes
- Zero acoplamento entre categorias

### ✅ Manutenibilidade
- Código organizado por domínio
- Fácil localizar e corrigir bugs
- Testes isolados por plugin

### ✅ Escalabilidade
- Plugins podem virar microserviços
- Deploy independente futuro
- Equipes podem trabalhar separadas

### ✅ Reutilização
- Core genérico compartilhado
- Padrões consistentes
- Menos duplicação de código

---

**Próximo**: [Microserviços](./06-MICROSERVICES.md)
