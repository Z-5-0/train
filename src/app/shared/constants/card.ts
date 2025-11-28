type HomeCard = {
  index: number;
  header: string;
  details: string;
  mapMode: 'FREE' | 'TRIP' | null;
  footer: HomeCardFooter;
};

interface HomeCardFooter {
  text: string,
  alignment: 'left' | 'right' | 'center',
  gradient: boolean
}

export const HOME_CARDS: HomeCard[] = [
  {
    index: 0,
    header: 'Route',
    details: 'selectedRoute',
    mapMode: 'TRIP',
    footer: {
      text: 'beta v0.1',
      alignment: 'right',
      gradient: true
    }
  },
  {
    index: 1,
    header: 'Map',
    details: '',
    mapMode: 'FREE',
    footer: {
      text: 'beta v0.1',
      alignment: 'right',
      gradient: false
    }
  },
  {
    index: 2,
    header: 'Settings',
    details: '',
    mapMode: null,
    footer: {
      text: 'beta v0.1',
      alignment: 'right',
      gradient: false
    }
  },
  {
    index: 3,
    header: 'Welcome',
    details: '',
    mapMode: null,
    footer: {
      text: 'beta v0.1',
      alignment: 'right',
      gradient: false
    }
  },
  {
    index: 4,
    header: 'Info',
    details: '',
    mapMode: null,
    footer: {
      text: 'beta v0.1',
      alignment: 'right',
      gradient: false
    }
  },
]