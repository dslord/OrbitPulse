export interface SpaceAgency {
  id: string;
  name: string;
  abbreviation: string;
  countryOrRegion: string;
  establishedYear: number;
  headquarters: string;
  description: string;
  websiteUrl: string;
  badgeColor: string;
}

export const SPACE_AGENCIES: SpaceAgency[] = [
  {
    id: 'isro',
    name: 'Indian Space Research Organisation',
    abbreviation: 'ISRO',
    countryOrRegion: 'India',
    establishedYear: 1969,
    headquarters: 'Bengaluru, Karnataka, India',
    description:
      'The national space agency of India operating under the Department of Space. Known for its cost-effective planetary exploration missions such as Chandrayaan lunar probes, Mangalyaan Mars Orbiter Mission, and PSLV/LVM3 launch vehicles.',
    websiteUrl: 'https://www.isro.gov.in',
    badgeColor: '#f97316',
  },
  {
    id: 'nasa',
    name: 'National Aeronautics and Space Administration',
    abbreviation: 'NASA',
    countryOrRegion: 'United States',
    establishedYear: 1958,
    headquarters: 'Washington, D.C., USA',
    description:
      'The executive branch agency of the United States government responsible for the civilian space program, aeronautics research, and space exploration, including the Apollo lunar missions, space shuttle fleet, and Artemis program.',
    websiteUrl: 'https://www.nasa.gov',
    badgeColor: '#0b3d91',
  },
  {
    id: 'esa',
    name: 'European Space Agency',
    abbreviation: 'ESA',
    countryOrRegion: 'Europe (22 Member States)',
    establishedYear: 1975,
    headquarters: 'Paris, France',
    description:
      'An intergovernmental organization dedicated to space exploration across 22 European member states, co-operating on Earth observation, satellite navigation (Galileo), space science, and Ariane launch systems.',
    websiteUrl: 'https://www.esa.int',
    badgeColor: '#003399',
  },
  {
    id: 'jaxa',
    name: 'Japan Aerospace Exploration Agency',
    abbreviation: 'JAXA',
    countryOrRegion: 'Japan',
    establishedYear: 2003,
    headquarters: 'Chofu, Tokyo, Japan',
    description:
      'Japan’s national aerospace agency formed through the merger of three aerospace organizations. Pioneer of asteroid sample return missions (Hayabusa series), Kibo ISS module operations, and H3 launch vehicles.',
    websiteUrl: 'https://global.jaxa.jp',
    badgeColor: '#00a3e0',
  },
  {
    id: 'cnsa',
    name: 'China National Space Administration',
    abbreviation: 'CNSA',
    countryOrRegion: 'China',
    establishedYear: 1993,
    headquarters: 'Haidian, Beijing, China',
    description:
      'The national space agency of the People’s Republic of China responsible for civil space activities and international space cooperation, operating the Tiangong space station and Chang’e lunar sample missions.',
    websiteUrl: 'https://www.cnsa.gov.cn',
    badgeColor: '#de2910',
  },
  {
    id: 'roscosmos',
    name: 'Roscosmos State Corporation',
    abbreviation: 'ROSCOSMOS',
    countryOrRegion: 'Russia',
    establishedYear: 1992,
    headquarters: 'Moscow, Russia',
    description:
      'The state corporation responsible for space flight and cosmonautics programs in Russia, maintaining the Soyuz crew transportation system, Progress cargo spacecraft, and Zvezda/Zarya ISS orbital modules.',
    websiteUrl: 'https://www.roscosmos.ru',
    badgeColor: '#1d4ed8',
  },
  {
    id: 'csa',
    name: 'Canadian Space Agency',
    abbreviation: 'CSA',
    countryOrRegion: 'Canada',
    establishedYear: 1989,
    headquarters: 'Longueuil, Quebec, Canada',
    description:
      'The federal agency responsible for Canada’s space program, world-renowned for robotic contributions to space exploration including Canadarm, Canadarm2, Dextre, and NASA Artemis lunar program optics.',
    websiteUrl: 'https://www.asc-csa.gc.ca',
    badgeColor: '#dc2626',
  },
  {
    id: 'asa',
    name: 'Australian Space Agency',
    abbreviation: 'ASA',
    countryOrRegion: 'Australia',
    establishedYear: 2018,
    headquarters: 'Adelaide, South Australia',
    description:
      'Australia’s national space organization focused on fostering domestic space industry growth, Earth observation, space domain awareness, satellite communications, and lunar rover development.',
    websiteUrl: 'https://www.space.gov.au',
    badgeColor: '#059669',
  },
];
