import { ImageSourcePropType } from 'react-native';

export const AGENCY_ICONS: Record<string, ImageSourcePropType> = {
  isro: require('../../assets/agencies/isro.png'),
  nasa: require('../../assets/agencies/nasa.png'),
  esa: require('../../assets/agencies/esa.png'),
  jaxa: require('../../assets/agencies/jaxa.png'),
  cnsa: require('../../assets/agencies/cnsa.png'),
  roscosmos: require('../../assets/agencies/roscosmos.png'),
  csa: require('../../assets/agencies/csa.png'),
  asa: require('../../assets/agencies/asa.png'),
  iss: require('../../assets/iss_agencies.png'),
};

/**
 * Returns the corresponding ImageSourcePropType for a given agency string,
 * matching against agency abbreviation, name, or key.
 */
export function getAgencyIcon(agencyInput?: string | null): ImageSourcePropType | null {
  if (!agencyInput) return null;
  const normalized = agencyInput.toLowerCase().trim();

  if (normalized.includes('iss')) {
    return AGENCY_ICONS.iss;
  }
  if (normalized.includes('isro') || normalized.includes('indian space research')) {
    return AGENCY_ICONS.isro;
  }
  if (normalized.includes('nasa') || normalized.includes('national aeronautics')) {
    return AGENCY_ICONS.nasa;
  }
  if (normalized.includes('esa') || normalized.includes('european space')) {
    return AGENCY_ICONS.esa;
  }
  if (normalized.includes('jaxa') || normalized.includes('japan aerospace')) {
    return AGENCY_ICONS.jaxa;
  }
  if (normalized.includes('cnsa') || normalized.includes('china national space')) {
    return AGENCY_ICONS.cnsa;
  }
  if (normalized.includes('roscosmos') || normalized.includes('russian')) {
    return AGENCY_ICONS.roscosmos;
  }
  if (normalized.includes('csa') || normalized.includes('canadian space')) {
    return AGENCY_ICONS.csa;
  }
  if (normalized.includes('asa') || normalized.includes('australian space')) {
    return AGENCY_ICONS.asa;
  }

  return null;
}
