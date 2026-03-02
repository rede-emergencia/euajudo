"""
Application Constants - Constantes globais da aplicação.

Valores que são usados em múltiplos domínios e não mudam frequentemente.
"""

# Commitment/Donation
COMMITMENT_TTL_HOURS = 48
"""Tempo de vida de um compromisso de doação (em horas)."""

PICKUP_CODE_LENGTH = 6
"""Tamanho do código de pickup para confirmação."""

MAX_ITEMS_PER_COMMITMENT = 10
"""Número máximo de itens em um único compromisso."""

# Pagination
DEFAULT_PAGE_SIZE = 20
"""Tamanho padrão de página para listagens."""

MAX_PAGE_SIZE = 100
"""Tamanho máximo de página permitido."""

# File Upload
MAX_FILE_SIZE_MB = 10
"""Tamanho máximo de arquivo em MB."""

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
"""Extensões de imagem permitidas."""

# Cache
CACHE_TTL_SECONDS = 300
"""TTL padrão de cache (5 minutos)."""

# API
API_VERSION = "v1"
"""Versão da API."""

REQUEST_TIMEOUT_SECONDS = 30
"""Timeout padrão para requests HTTP."""
