export const TABLE_STATUS_COLORS = {
  blank: {
    label: 'Blank Table',
    color: '#ffffff',
    textColor: '#94a3b8',
    dot: '#e0e0e0',
    borderColor: '#eee',
    borderStyle: 'dashed'
  },
  running: {
    label: 'Running Table',
    color: '#0288d1',
    textColor: '#ffffff',
    dot: '#ffffff',
    borderColor: '#01579b',
    borderStyle: 'solid'
  },
  printed: {
    label: 'Printed Table',
    color: '#2e7d32',
    textColor: '#ffffff',
    dot: '#ffffff',
    borderColor: '#1b5e20',
    borderStyle: 'solid'
  },
  paid: {
    label: 'Paid Table',
    color: '#ef6c00',
    textColor: '#ffffff',
    dot: '#ffffff',
    borderColor: '#e65100',
    borderStyle: 'solid'
  },
  'running-kot': {
    label: 'Running KOT Table',
    color: '#fbc02d',
    textColor: '#000000',
    dot: '#000000',
    borderColor: '#f9a825',
    borderStyle: 'solid'
  }
};

export const TABLE_SECTIONS = [
  {
    id: 'ac',
    label: 'AC',
    tables: Array.from({ length: 20 }, (_, i) => ({
      id: `AC${i + 1}`,
      name: `AC${i + 1}`,
      status: i === 3 ? 'running' : (i === 15 ? 'printed' : 'blank'),
      capacity: 4
    }))
  },
  {
    id: 'garden',
    label: 'Garden',
    tables: Array.from({ length: 20 }, (_, i) => ({
      id: `G${i + 21}`,
      name: `G${i + 21}`,
      status: i === 5 ? 'paid' : (i === 12 ? 'running-kot' : 'blank'),
      capacity: 6
    }))
  },
  {
    id: 'non-ac',
    label: 'Non AC',
    tables: Array.from({ length: 15 }, (_, i) => ({
      id: `N${i + 41}`,
      name: `N${i + 41}`,
      status: 'blank',
      capacity: 2
    }))
  }
];
