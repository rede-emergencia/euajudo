# 🏗️ Arquitetura Escalável de Necessidades dos Abrigos

**Data:** 2 de Março, 2026  
**Objetivo:** Sistema escalável para múltiplos tipos de necessidades

---

## 🎯 **VISÃO GERAL**

### **Conceito:**
Um abrigo pode ter **múltiplas necessidades simultâneas**:
- 🔴 Doações de produtos (água, alimentos, roupas)
- 🟣 Serviços necessários (eletricista, limpeza, aulas)
- 🔵 Entregas diretas (voluntário busca X e leva para Y)
- 🟡 Eventos especiais (campanhas, ações específicas)

### **Princípios:**
1. **Agregação:** Frontend agrega todas as necessidades
2. **Priorização:** Ícone/cor reflete necessidade mais urgente
3. **Escalabilidade:** Fácil adicionar novos tipos
4. **Filtros:** Usuário pode filtrar por tipo de necessidade

---

## 📊 **MODELO DE DADOS (Backend)**

### **Estrutura Atual:**

```sql
-- 1. DOAÇÕES (já existe)
CREATE TABLE shelter_requests (
    id INTEGER PRIMARY KEY,
    shelter_id INTEGER,
    category_id INTEGER,
    quantity_requested INTEGER,
    quantity_received INTEGER,
    status TEXT,  -- pending, partial, completed, cancelled
    priority TEXT,  -- low, medium, high, urgent
    created_at TIMESTAMP
);

-- 2. SERVIÇOS (futuro - similar ao shelter_requests)
CREATE TABLE service_requests (
    id INTEGER PRIMARY KEY,
    shelter_id INTEGER,
    service_type TEXT,  -- eletricista, limpeza, aulas, etc
    description TEXT,
    duration_hours INTEGER,
    people_needed INTEGER,
    status TEXT,  -- pending, in_progress, completed, cancelled
    priority TEXT,
    created_at TIMESTAMP
);

-- 3. ENTREGAS DIRETAS (já existe - deliveries)
CREATE TABLE deliveries (
    id INTEGER PRIMARY KEY,
    volunteer_id INTEGER,
    delivery_location_id INTEGER,
    category_id INTEGER,
    quantity INTEGER,
    status TEXT,  -- available, reserved, in_transit, completed
    created_at TIMESTAMP
);

-- 4. EVENTOS (futuro)
CREATE TABLE shelter_events (
    id INTEGER PRIMARY KEY,
    shelter_id INTEGER,
    event_type TEXT,
    title TEXT,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    volunteers_needed INTEGER,
    status TEXT
);
```

### **Metadata Cache (para performance):**
```sql
-- Cache agregado de necessidades por shelter
CREATE TABLE shelter_needs_cache (
    shelter_id INTEGER PRIMARY KEY,
    has_donation_requests BOOLEAN,
    has_service_requests BOOLEAN,
    has_delivery_needs BOOLEAN,
    has_events BOOLEAN,
    priority_level TEXT,  -- urgent, high, medium, low
    updated_at TIMESTAMP
);
```

---

## 🎨 **SISTEMA DE ÍCONES E CORES**

### **Lógica de Priorização:**

```javascript
// Ordem de prioridade (do mais urgente ao menos)
const NEED_TYPES = {
  URGENT_DONATION: { icon: '🆘', color: '#dc2626', priority: 1 },
  DONATION: { icon: '🔴', color: '#ef4444', priority: 2 },
  SERVICE: { icon: '🟣', color: '#a855f7', priority: 3 },
  DELIVERY: { icon: '🔵', color: '#3b82f6', priority: 4 },
  EVENT: { icon: '🟡', color: '#eab308', priority: 5 },
  AVAILABLE: { icon: '🟢', color: '#10b981', priority: 6 }
};

// Função para determinar ícone/cor baseado em necessidades
function getShelterIconAndColor(needs) {
  // Verificar necessidades por prioridade
  if (needs.urgentDonations > 0) return NEED_TYPES.URGENT_DONATION;
  if (needs.donations > 0) return NEED_TYPES.DONATION;
  if (needs.services > 0) return NEED_TYPES.SERVICE;
  if (needs.deliveries > 0) return NEED_TYPES.DELIVERY;
  if (needs.events > 0) return NEED_TYPES.EVENT;
  return NEED_TYPES.AVAILABLE;
}
```

### **Ícones Compostos (futuro):**
```javascript
// Para mostrar múltiplas necessidades simultaneamente
// Exemplo: 🔴🟣 (doações + serviços)
function getCompositeIcon(needs) {
  const icons = [];
  if (needs.donations > 0) icons.push('🔴');
  if (needs.services > 0) icons.push('🟣');
  if (needs.deliveries > 0) icons.push('🔵');
  return icons.join('') || '🟢';
}
```

---

## 🔄 **FLUXO DE DADOS (Frontend)**

### **1. Carregamento de Dados:**

```javascript
// MapView.jsx - loadData()
const loadData = async () => {
  // Carregar TODAS as necessidades
  const [
    locationsData,
    donationRequests,
    serviceRequests,  // futuro
    deliveries,
    events  // futuro
  ] = await Promise.all([
    fetch('/api/locations/'),
    inventory.getRequests(),  // doações
    // services.getRequests(),  // futuro
    fetch('/api/deliveries/'),
    // events.getActive()  // futuro
  ]);
  
  // Armazenar em estados separados
  setLocations(locationsData);
  setDonationRequests(donationRequests);
  // setServiceRequests(serviceRequests);
  setDeliveries(deliveries);
  // setEvents(events);
};
```

### **2. Agregação de Necessidades:**

```javascript
// Função para agregar todas as necessidades de um shelter
function aggregateShelterNeeds(shelterId, data) {
  const {
    donationRequests,
    serviceRequests,
    deliveries,
    events
  } = data;
  
  // Filtrar por shelter e status ativo
  const activeDonations = donationRequests.filter(r =>
    r.shelter_id === shelterId &&
    ['pending', 'partial', 'active'].includes(r.status)
  );
  
  const activeServices = serviceRequests.filter(r =>
    r.shelter_id === shelterId &&
    ['pending', 'in_progress'].includes(r.status)
  );
  
  const activeDeliveries = deliveries.filter(d =>
    d.delivery_location_id === locationId &&
    d.status === 'available'
  );
  
  const activeEvents = events.filter(e =>
    e.shelter_id === shelterId &&
    e.status === 'active' &&
    new Date(e.start_date) <= new Date()
  );
  
  // Verificar urgência
  const urgentDonations = activeDonations.filter(r =>
    r.priority === 'urgent'
  );
  
  return {
    donations: activeDonations.length,
    urgentDonations: urgentDonations.length,
    services: activeServices.length,
    deliveries: activeDeliveries.length,
    events: activeEvents.length,
    total: activeDonations.length + activeServices.length + 
           activeDeliveries.length + activeEvents.length,
    // Dados detalhados para o modal
    donationsList: activeDonations,
    servicesList: activeServices,
    deliveriesList: activeDeliveries,
    eventsList: activeEvents
  };
}
```

### **3. Renderização do Marcador:**

```javascript
// Para cada location (shelter)
locations.forEach(location => {
  // Agregar necessidades
  const needs = aggregateShelterNeeds(location.user_id, {
    donationRequests,
    serviceRequests,
    deliveries,
    events
  });
  
  // Determinar ícone e cor
  const { icon, color } = getShelterIconAndColor(needs);
  
  // Criar marcador
  const marker = L.marker([location.latitude, location.longitude], {
    icon: makeLucideIcon('home', color, size)
  });
  
  // Bind popup com TODAS as necessidades
  marker.bindPopup(createShelterPopup(location, needs));
});
```

---

## 🎨 **MODAL DO ABRIGO (Escalável)**

### **Estrutura:**

```html
<div class="shelter-modal">
  <!-- Header com ícone principal -->
  <div class="header" style="background: ${color}">
    <span>${icon}</span>
    <h3>${location.name}</h3>
  </div>
  
  <!-- Badges de necessidades -->
  <div class="needs-badges">
    ${needs.donations > 0 ? '<span class="badge red">🔴 ${needs.donations} Doações</span>' : ''}
    ${needs.services > 0 ? '<span class="badge purple">🟣 ${needs.services} Serviços</span>' : ''}
    ${needs.deliveries > 0 ? '<span class="badge blue">🔵 ${needs.deliveries} Entregas</span>' : ''}
    ${needs.events > 0 ? '<span class="badge yellow">🟡 ${needs.events} Eventos</span>' : ''}
  </div>
  
  <!-- Seções expandíveis -->
  ${needs.donations > 0 ? renderDonationsSection(needs.donationsList) : ''}
  ${needs.services > 0 ? renderServicesSection(needs.servicesList) : ''}
  ${needs.deliveries > 0 ? renderDeliveriesSection(needs.deliveriesList) : ''}
  ${needs.events > 0 ? renderEventsSection(needs.eventsList) : ''}
  
  <!-- Mensagem se não há necessidades -->
  ${needs.total === 0 ? '<p>✅ Sem necessidades no momento</p>' : ''}
</div>
```

### **Seções Renderizadas:**

```javascript
function renderDonationsSection(donations) {
  return `
    <div class="section donations">
      <h4>🔴 Doações Necessárias</h4>
      ${donations.map(d => `
        <div class="item">
          <span>${d.category.display_name}</span>
          <span>${d.quantity_requested - d.quantity_received} ${d.unit}</span>
        </div>
      `).join('')}
      <button onclick="commitToDonation()">🤝 Quero Doar</button>
    </div>
  `;
}

function renderServicesSection(services) {
  return `
    <div class="section services">
      <h4>🟣 Serviços Necessários</h4>
      ${services.map(s => `
        <div class="item">
          <span>${s.service_type}</span>
          <span>${s.duration_hours}h - ${s.people_needed} pessoas</span>
        </div>
      `).join('')}
      <button onclick="commitToService()">🤝 Quero Ajudar</button>
    </div>
  `;
}
```

---

## 🔍 **SISTEMA DE FILTROS**

### **UI de Filtros:**

```javascript
const [activeFilters, setActiveFilters] = useState({
  donations: true,
  services: true,
  deliveries: true,
  events: true,
  available: true  // mostrar abrigos sem necessidades
});

// Componente de filtros
<div class="map-filters">
  <button 
    class={activeFilters.donations ? 'active' : ''}
    onClick={() => toggleFilter('donations')}
  >
    🔴 Doações
  </button>
  <button 
    class={activeFilters.services ? 'active' : ''}
    onClick={() => toggleFilter('services')}
  >
    🟣 Serviços
  </button>
  <button 
    class={activeFilters.deliveries ? 'active' : ''}
    onClick={() => toggleFilter('deliveries')}
  >
    🔵 Entregas
  </button>
  <button 
    class={activeFilters.events ? 'active' : ''}
    onClick={() => toggleFilter('events')}
  >
    🟡 Eventos
  </button>
</div>
```

### **Lógica de Filtro:**

```javascript
// Filtrar shelters baseado nos filtros ativos
const filteredShelters = locations.filter(location => {
  const needs = aggregateShelterNeeds(location.user_id, data);
  
  // Se não tem necessidades, mostrar apenas se filtro 'available' ativo
  if (needs.total === 0) return activeFilters.available;
  
  // Mostrar se qualquer tipo de necessidade está ativo nos filtros
  return (
    (needs.donations > 0 && activeFilters.donations) ||
    (needs.services > 0 && activeFilters.services) ||
    (needs.deliveries > 0 && activeFilters.deliveries) ||
    (needs.events > 0 && activeFilters.events)
  );
});
```

---

## 🚀 **IMPLEMENTAÇÃO GRADUAL**

### **Fase 1 (Atual):**
- ✅ Doações (shelter_requests)
- ✅ Ícone vermelho para doações ativas
- ✅ Modal mostra lista de doações

### **Fase 2 (Próxima):**
- ⏳ Adicionar service_requests ao backend
- ⏳ Agregar doações + serviços no frontend
- ⏳ Ícone roxo para serviços
- ⏳ Modal com seções separadas

### **Fase 3 (Futuro):**
- ⏳ Adicionar eventos
- ⏳ Ícones compostos (🔴🟣)
- ⏳ Filtros por tipo
- ⏳ Priorização visual

---

## 📝 **CÓDIGO ESCALÁVEL**

### **Estrutura de Dados:**

```javascript
// types.js - Definições centralizadas
export const NEED_TYPES = {
  DONATION: 'donation',
  SERVICE: 'service',
  DELIVERY: 'delivery',
  EVENT: 'event'
};

export const NEED_CONFIG = {
  [NEED_TYPES.DONATION]: {
    icon: '🔴',
    color: '#ef4444',
    label: 'Doações',
    priority: 1,
    endpoints: {
      list: '/api/inventory/requests',
      commit: '/api/inventory/commit'
    }
  },
  [NEED_TYPES.SERVICE]: {
    icon: '🟣',
    color: '#a855f7',
    label: 'Serviços',
    priority: 2,
    endpoints: {
      list: '/api/services/requests',
      commit: '/api/services/commit'
    }
  },
  // ... outros tipos
};
```

### **Função Genérica:**

```javascript
// Função genérica para carregar necessidades
async function loadNeedsOfType(type) {
  const config = NEED_CONFIG[type];
  if (!config) return [];
  
  try {
    const response = await fetch(config.endpoints.list);
    return response.json();
  } catch (error) {
    console.error(`Erro ao carregar ${config.label}:`, error);
    return [];
  }
}

// Uso
const donations = await loadNeedsOfType(NEED_TYPES.DONATION);
const services = await loadNeedsOfType(NEED_TYPES.SERVICE);
```

---

## ✅ **BENEFÍCIOS DA ARQUITETURA**

1. **Escalável:** Adicionar novo tipo = adicionar config + endpoint
2. **Manutenível:** Lógica centralizada e reutilizável
3. **Performático:** Cache agregado no backend
4. **Flexível:** Filtros e priorização configuráveis
5. **Intuitivo:** Ícones/cores claros para usuários

---

## 🎯 **PRÓXIMOS PASSOS**

1. ✅ Implementar agregação de necessidades no frontend
2. ✅ Atualizar modal para mostrar seções
3. ⏳ Adicionar service_requests ao backend
4. ⏳ Implementar filtros no mapa
5. ⏳ Criar sistema de ícones compostos

**Sistema preparado para crescer!** 🚀
