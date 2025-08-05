type HomeCard = {
  index: number;
  header: string;
  details?: string;
  footer: string;
};

export const HOME_CARDS: HomeCard[] = [
    { index: 1, header: 'Route', details: 'selectedRoute', footer: 'footer' },
    { index: 2, header: 'Map', footer: 'footer' },
    { index: 3, header: 'Settings', footer: 'footer' },
    { index: 4, header: 'Welcome', footer: '' },
    { index: 5, header: 'Info', footer: '' },   // Details, legend...
]