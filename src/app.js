const state = {
  clients: [],
  filters: {
    industry: 'all',
    location: 'all',
    service: 'all',
  },
};

const colors = ['#2f5fb3', '#f59e0b', '#27ae60', '#16a085', '#8e44ad', '#b9c0c8', '#3b82f6', '#ef476f'];

const elements = {
  industryFilter: document.querySelector('#industryFilter'),
  locationFilter: document.querySelector('#locationFilter'),
  serviceFilter: document.querySelector('#serviceFilter'),
  totalClients: document.querySelector('#totalClients'),
  activeClients: document.querySelector('#activeClients'),
  industryCount: document.querySelector('#industryCount'),
  countryCount: document.querySelector('#countryCount'),
  serviceCount: document.querySelector('#serviceCount'),
  industryTotal: document.querySelector('#industryTotal'),
  industryBars: document.querySelector('#industryBars'),
  locationDonut: document.querySelector('#locationDonut'),
  donutTotal: document.querySelector('#donutTotal'),
  locationLegend: document.querySelector('#locationLegend'),
  serviceCloud: document.querySelector('#serviceCloud'),
  clientGrid: document.querySelector('#clientGrid'),
  clientResultCount: document.querySelector('#clientResultCount'),
  clientTemplate: document.querySelector('#clientCardTemplate'),
};

async function loadClients() {
  const response = await fetch('data/clients.json');
  if (!response.ok) {
    throw new Error(`Unable to load clients.json: ${response.status}`);
  }
  state.clients = await response.json();
  populateFilters();
  render();
}

function unique(values) {
  return [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
}

function populateSelect(select, values) {
  select.querySelectorAll('option:not([value="all"])').forEach((option) => option.remove());
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function populateFilters() {
  populateSelect(elements.industryFilter, unique(state.clients.map((client) => client.industry)));
  populateSelect(elements.locationFilter, unique(state.clients.map((client) => client.location.country)));
  populateSelect(elements.serviceFilter, unique(state.clients.flatMap((client) => client.services)));

  elements.industryFilter.addEventListener('change', (event) => {
    state.filters.industry = event.target.value;
    render();
  });
  elements.locationFilter.addEventListener('change', (event) => {
    state.filters.location = event.target.value;
    render();
  });
  elements.serviceFilter.addEventListener('change', (event) => {
    state.filters.service = event.target.value;
    render();
  });
}

function getFilteredClients() {
  return state.clients.filter((client) => {
    const industryMatch = state.filters.industry === 'all' || client.industry === state.filters.industry;
    const locationMatch = state.filters.location === 'all' || client.location.country === state.filters.location;
    const serviceMatch = state.filters.service === 'all' || client.services.includes(state.filters.service);
    return industryMatch && locationMatch && serviceMatch;
  });
}

function render() {
  const clients = getFilteredClients();
  renderMetrics(clients);
  renderIndustryBars(clients);
  renderLocationDonut(clients);
  renderServiceCloud(clients);
  renderClientCards(clients);
}

function renderMetrics(clients) {
  const activeCount = clients.filter((client) => client.status.toLowerCase() === 'active').length;
  const industries = unique(clients.map((client) => client.industry));
  const countries = unique(clients.map((client) => client.location.country));
  const services = unique(clients.flatMap((client) => client.services));

  elements.totalClients.textContent = clients.length;
  elements.activeClients.textContent = `${activeCount} active relationships`;
  elements.industryCount.textContent = industries.length;
  elements.countryCount.textContent = countries.length;
  elements.serviceCount.textContent = services.length;
}

function renderIndustryBars(clients) {
  elements.industryBars.replaceChildren();
  const industryCounts = [...countBy(clients, (client) => client.industry)].sort((a, b) => b[1] - a[1]);
  const max = Math.max(...industryCounts.map(([, count]) => count), 1);
  elements.industryTotal.textContent = `${clients.length} total`;

  industryCounts.forEach(([industry, count]) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <span>${industry}</span>
      <div class="bar-track" aria-label="${industry}: ${count} clients">
        <div class="bar-fill" style="width: ${(count / max) * 100}%"><strong>${count}</strong></div>
      </div>
    `;
    elements.industryBars.append(row);
  });

  if (!industryCounts.length) {
    elements.industryBars.append(emptyState('No industries match the current filters.'));
  }
}

function renderLocationDonut(clients) {
  elements.locationDonut.querySelectorAll('circle, text').forEach((node) => node.remove());
  elements.locationLegend.replaceChildren();
  elements.donutTotal.textContent = clients.length;

  const locationCounts = [...countBy(clients, (client) => client.location.country)].sort((a, b) => b[1] - a[1]);
  const total = clients.length || 1;
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const base = createSvgElement('circle', {
    cx: 110,
    cy: 110,
    r: radius,
    fill: 'none',
    stroke: '#e9edf5',
    'stroke-width': 30,
  });
  elements.locationDonut.append(base);

  locationCounts.forEach(([country, count], index) => {
    const percent = count / total;
    const segment = createSvgElement('circle', {
      cx: 110,
      cy: 110,
      r: radius,
      fill: 'none',
      stroke: colors[index % colors.length],
      'stroke-width': 30,
      'stroke-dasharray': `${percent * circumference} ${circumference}`,
      'stroke-dashoffset': -offset,
      'stroke-linecap': 'butt',
      transform: 'rotate(-90 110 110)',
    });
    elements.locationDonut.append(segment);
    offset += percent * circumference;

    const legendItem = document.createElement('li');
    legendItem.innerHTML = `<span><i style="background:${colors[index % colors.length]}"></i>${country}</span><strong>${Math.round(percent * 100)}%</strong>`;
    elements.locationLegend.append(legendItem);
  });

  if (!locationCounts.length) {
    elements.locationLegend.append(emptyState('No locations match the current filters.'));
  }
}

function renderServiceCloud(clients) {
  elements.serviceCloud.replaceChildren();
  const serviceCounts = [...countBy(clients.flatMap((client) => client.services), (service) => service)].sort((a, b) => b[1] - a[1]);
  const max = Math.max(...serviceCounts.map(([, count]) => count), 1);

  serviceCounts.forEach(([service, count], index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'service-chip';
    chip.style.setProperty('--chip-scale', String(0.9 + count / max));
    chip.style.setProperty('--chip-color', colors[index % colors.length]);
    chip.innerHTML = `<span>${service}</span><strong>${count}</strong>`;
    chip.addEventListener('click', () => {
      state.filters.service = service;
      elements.serviceFilter.value = service;
      render();
    });
    elements.serviceCloud.append(chip);
  });

  if (!serviceCounts.length) {
    elements.serviceCloud.append(emptyState('No services match the current filters.'));
  }
}

function renderClientCards(clients) {
  elements.clientGrid.replaceChildren();
  elements.clientResultCount.textContent = `${clients.length} shown`;

  clients.forEach((client) => {
    const fragment = elements.clientTemplate.content.cloneNode(true);
    fragment.querySelector('h3').textContent = client.name;
    fragment.querySelector('.status-pill').textContent = client.status;
    fragment.querySelector('.status-pill').dataset.status = client.status.toLowerCase();
    fragment.querySelector('.client-meta').textContent = `${client.industry} • ${client.location.city}, ${client.location.country} • Since ${formatYear(client.since)}`;
    const chipList = fragment.querySelector('.chip-list');
    client.services.forEach((service) => {
      const chip = document.createElement('span');
      chip.textContent = service;
      chipList.append(chip);
    });
    elements.clientGrid.append(fragment);
  });

  if (!clients.length) {
    elements.clientGrid.append(emptyState('No clients match the current filters.'));
  }
}

function createSvgElement(name, attributes) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function formatYear(value) {
  return new Intl.DateTimeFormat('en', { year: 'numeric' }).format(new Date(value));
}

function emptyState(message) {
  const node = document.createElement('p');
  node.className = 'empty-state';
  node.textContent = message;
  return node;
}

loadClients().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML('afterbegin', `<p class="load-error">${error.message}</p>`);
});
