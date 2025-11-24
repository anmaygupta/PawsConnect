// Common ZIP code to city mapping for demonstration
// In a real application, you might use a more comprehensive database or API
const zipCodeMap: Record<string, string> = {
  // California
  '94582': 'San Ramon',
  '94583': 'San Ramon',
  '94588': 'Pleasanton',
  '94566': 'Pleasanton',
  '94568': 'Dublin',
  '94551': 'Livermore',
  '94552': 'Livermore',
  '90210': 'Beverly Hills',
  '90211': 'Beverly Hills',
  '90028': 'Hollywood',
  '90068': 'Hollywood',
  '94102': 'San Francisco',
  '94103': 'San Francisco',
  '94104': 'San Francisco',
  '94105': 'San Francisco',
  '94107': 'San Francisco',
  '94108': 'San Francisco',
  '94109': 'San Francisco',
  '94110': 'San Francisco',
  '94111': 'San Francisco',
  '94112': 'San Francisco',
  '94114': 'San Francisco',
  '94115': 'San Francisco',
  '94116': 'San Francisco',
  '94117': 'San Francisco',
  '94118': 'San Francisco',
  '94121': 'San Francisco',
  '94122': 'San Francisco',
  '94123': 'San Francisco',
  '94124': 'San Francisco',
  '94127': 'San Francisco',
  '94131': 'San Francisco',
  '94132': 'San Francisco',
  '94133': 'San Francisco',
  '94134': 'San Francisco',
  
  // New York
  '10001': 'New York',
  '10002': 'New York',
  '10003': 'New York',
  '10004': 'New York',
  '10005': 'New York',
  '10006': 'New York',
  '10007': 'New York',
  '10009': 'New York',
  '10010': 'New York',
  '10011': 'New York',
  '10012': 'New York',
  '10013': 'New York',
  '10014': 'New York',
  '10016': 'New York',
  '10017': 'New York',
  '10018': 'New York',
  '10019': 'New York',
  '10020': 'New York',
  '10021': 'New York',
  '10022': 'New York',
  '10023': 'New York',
  '10024': 'New York',
  '10025': 'New York',
  '10026': 'New York',
  '10027': 'New York',
  '10028': 'New York',
  '10029': 'New York',
  '10030': 'New York',
  '10031': 'New York',
  '10032': 'New York',
  '10033': 'New York',
  '10034': 'New York',
  '10035': 'New York',
  '10036': 'New York',
  '10037': 'New York',
  '10038': 'New York',
  '10039': 'New York',
  '10040': 'New York',
  
  // Texas
  '77001': 'Houston',
  '77002': 'Houston',
  '77003': 'Houston',
  '77004': 'Houston',
  '77005': 'Houston',
  '77006': 'Houston',
  '77007': 'Houston',
  '77008': 'Houston',
  '77009': 'Houston',
  '77010': 'Houston',
  '75201': 'Dallas',
  '75202': 'Dallas',
  '75203': 'Dallas',
  '75204': 'Dallas',
  '75205': 'Dallas',
  '75206': 'Dallas',
  '75207': 'Dallas',
  '75208': 'Dallas',
  '75209': 'Dallas',
  '75210': 'Dallas',
  '78701': 'Austin',
  '78702': 'Austin',
  '78703': 'Austin',
  '78704': 'Austin',
  '78705': 'Austin',
  
  // Florida
  '33101': 'Miami',
  '33102': 'Miami',
  '33109': 'Miami Beach',
  '33139': 'Miami Beach',
  '33140': 'Miami Beach',
  '33141': 'Miami Beach',
  '32801': 'Orlando',
  '32802': 'Orlando',
  '32803': 'Orlando',
  '32804': 'Orlando',
  '32805': 'Orlando',
  
  // Illinois
  '60601': 'Chicago',
  '60602': 'Chicago',
  '60603': 'Chicago',
  '60604': 'Chicago',
  '60605': 'Chicago',
  '60606': 'Chicago',
  '60607': 'Chicago',
  '60608': 'Chicago',
  '60609': 'Chicago',
  '60610': 'Chicago',
  '60611': 'Chicago',
  '60612': 'Chicago',
  '60613': 'Chicago',
  '60614': 'Chicago',
  '60615': 'Chicago',
  '60616': 'Chicago',
  '60617': 'Chicago',
  '60618': 'Chicago',
  '60619': 'Chicago',
  '60620': 'Chicago',
  
  // Washington
  '98101': 'Seattle',
  '98102': 'Seattle',
  '98103': 'Seattle',
  '98104': 'Seattle',
  '98105': 'Seattle',
  '98106': 'Seattle',
  '98107': 'Seattle',
  '98108': 'Seattle',
  '98109': 'Seattle',
  '98110': 'Seattle',
  '98111': 'Seattle',
  '98112': 'Seattle',
  '98113': 'Seattle',
  '98114': 'Seattle',
  '98115': 'Seattle',
  '98116': 'Seattle',
  '98117': 'Seattle',
  '98118': 'Seattle',
  '98119': 'Seattle',
  '98121': 'Seattle',
  '98122': 'Seattle',
  '98125': 'Seattle',
  '98126': 'Seattle',
  '98133': 'Seattle',
  '98134': 'Seattle',
  '98136': 'Seattle',
  '98144': 'Seattle',
  '98146': 'Seattle',
  '98148': 'Seattle',
  '98154': 'Seattle',
  '98155': 'Seattle',
  '98158': 'Seattle',
  '98160': 'Seattle',
  '98161': 'Seattle',
  '98164': 'Seattle',
  '98165': 'Seattle',
  '98166': 'Seattle',
  '98168': 'Seattle',
  '98174': 'Seattle',
  '98175': 'Seattle',
  '98177': 'Seattle',
  '98178': 'Seattle',
  '98181': 'Seattle',
  '98185': 'Seattle',
  '98188': 'Seattle',
  '98194': 'Seattle',
  '98195': 'Seattle',
  '98199': 'Seattle'
};

export function lookupCity(zipCode: string): string | null {
  const trimmedZip = zipCode.trim();
  return zipCodeMap[trimmedZip] || null;
}

export function formatConfirmation(zipCode: string): string {
  const city = lookupCity(zipCode);
  if (city) {
    return `${zipCode} (${city})`;
  }
  return zipCode;
}

export function getSurroundingZipCodes(zipCode: string): string[] {
  const zip = parseInt(zipCode, 10);
  if (isNaN(zip) || zipCode.length !== 5) {
    return [];
  }

  const surrounding: string[] = [];
  
  // Generate surrounding zip codes (±1 to ±5 range)
  for (let offset = 1; offset <= 5; offset++) {
    const lowerZip = zip - offset;
    const upperZip = zip + offset;
    
    // Check valid 5-digit zip code range (00001-99999)
    if (lowerZip >= 1 && lowerZip <= 99999) {
      surrounding.push(lowerZip.toString().padStart(5, '0'));
    }
    if (upperZip >= 1 && upperZip <= 99999) {
      surrounding.push(upperZip.toString().padStart(5, '0'));
    }
  }
  
  return surrounding;
}