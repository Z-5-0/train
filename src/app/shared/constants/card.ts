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
    footer: 'beta_v_0.1'
  },
  {
    index: 1,
    header: 'Map',
    details: '',
    mapMode: 'FREE',
    footer: 'beta_v_0.1'
  },
  {
    index: 2,
    header: 'Settings',
    details: '',
    mapMode: null,
    footer: 'beta_v_0.1'
  },
  {
    index: 3,
    header: 'Welcome',
    details: '',
    mapMode: null,
    footer: 'beta_v_0.1'
  },
  {
    index: 4,
    header: 'Info',
    details: '',
    mapMode: null,
    footer: 'beta_v_0.1'
  },
]