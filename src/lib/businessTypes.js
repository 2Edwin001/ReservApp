export const CAPACITY_RANGES = {
  restaurant: { min: 1,  max: 20 },  // de 1 persona a mesa grande
  parking:    { min: 1,  max: 1  },  // 1 vehículo por puesto
  carwash:    { min: 1,  max: 1  },  // 1 vehículo por bahía
  salon:      { min: 1,  max: 8  },  // individual o grupo pequeño
  court:      { min: 2,  max: 22 },  // tenis (2) hasta fútbol 11 (22)
  office:     { min: 1,  max: 50 },  // sala de reuniones
}

export function capacityRange(type) {
  return CAPACITY_RANGES[type] ?? { min: 1, max: 20 }
}

export const BUSINESS_ICONS = {
  restaurant: '🍽️',
  parking:    '🅿️',
  carwash:    '🚗',
  salon:      '✂️',
  court:      '🏆',
  office:     '🏢',
}

export const UNIT_LABELS = {
  restaurant: { singular: 'Mesa',   plural: 'Mesas',   article: 'tu mesa' },
  parking:    { singular: 'Puesto', plural: 'Puestos', article: 'tu puesto' },
  carwash:    { singular: 'Bahía',  plural: 'Bahías',  article: 'tu bahía' },
  salon:      { singular: 'Silla',  plural: 'Sillas',  article: 'tu silla' },
  court:      { singular: 'Cancha', plural: 'Canchas', article: 'tu cancha' },
  office:     { singular: 'Sala',   plural: 'Salas',   article: 'tu sala' },
}

export function unitLabel(type, form = 'plural') {
  return UNIT_LABELS[type]?.[form] ?? (form === 'plural' ? 'Espacios' : 'Espacio')
}
