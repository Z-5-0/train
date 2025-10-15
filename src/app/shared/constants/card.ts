type HomeCard = {
  index: number;
  header: string;
  details: string;
  mapMode: 'FREE' | 'TRIP' | null;
  footer: string;
};

export const HOME_CARDS: HomeCard[] = [
  {
    index: 0,
    header: 'Route',
    details: 'selectedRoute',
    mapMode: 'TRIP',
    footer: 'footer'
  },
  {
    index: 1,
    header: 'Map',
    details: '',
    mapMode: 'FREE',
    footer: 'footer'
  },
  {
    index: 2,
    header: 'Settings',
    details: '',
    mapMode: null,
    footer: 'footer'
  },
  {
    index: 3,
    header: 'Welcome',
    details: '',
    mapMode: null,
    footer: ''
  },
  {
    index: 4,
    header: 'Info',
    details: '',
    mapMode: null,
    footer: ''
  },
]