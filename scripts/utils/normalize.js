/**
 * Normalize raw coaching specialties to the taxonomy used by the frontend.
 *
 * Frontend area-to-specialty mapping:
 *   werk        → werk, carriere, burnout, leiderschap, carrierewisseling
 *   sociaal     → sociaal, zelfvertrouwen, angst, netwerken, communicatie
 *   relatie     → relatie, communicatie, gezin, zelfliefde
 *   financieel  → financieel, ondernemerschap, doelen
 *   geluk       → geluk, mindfulness, stress, persoonlijke groei
 *   gezondheid  → gezondheid, lifestyle, energie, burnout, balans
 *   praktisch   → praktisch, timemanagement, productiviteit
 */

// Maps raw Dutch/English terms (lowercased) to normalized specialty slug(s)
const SPECIALTY_MAP = {
  // werk / career
  'loopbaan': ['werk', 'carriere'],
  'loopbaancoaching': ['werk', 'carriere'],
  'loopbaanbegeleiding': ['werk', 'carriere'],
  'carriere': ['carriere', 'werk'],
  'carrièrecoach': ['carriere', 'werk'],
  'career coaching': ['carriere', 'werk'],
  'career coach': ['carriere', 'werk'],
  'carrière': ['carriere', 'werk'],
  'werk': ['werk'],
  'werkcoaching': ['werk'],
  're-integratie': ['werk'],
  'reintegratie': ['werk'],
  'outplacement': ['werk', 'carrierewisseling'],
  'carrierewisseling': ['carrierewisseling', 'werk'],
  'sollicitatie': ['werk', 'carriere'],
  'executive coaching': ['leiderschap', 'werk'],
  'executive coach': ['leiderschap', 'werk'],
  'leiderschap': ['leiderschap', 'werk'],
  'leiderschapscoaching': ['leiderschap', 'werk'],
  'management coaching': ['leiderschap', 'werk'],
  'teamcoaching': ['leiderschap', 'werk'],

  // burnout / stress
  'burnout': ['burnout', 'werk', 'gezondheid'],
  'burn-out': ['burnout', 'werk', 'gezondheid'],
  'burn out': ['burnout', 'werk', 'gezondheid'],
  'overspannenheid': ['burnout', 'stress'],
  'stress': ['stress', 'geluk'],
  'stresscoaching': ['stress', 'geluk'],
  'stressbegeleiding': ['stress', 'geluk'],

  // sociaal / zelfvertrouwen
  'sociaal': ['sociaal'],
  'sociale vaardigheden': ['sociaal', 'communicatie'],
  'zelfvertrouwen': ['zelfvertrouwen', 'sociaal'],
  'assertiviteit': ['zelfvertrouwen', 'sociaal'],
  'faalangst': ['angst', 'zelfvertrouwen'],
  'angst': ['angst', 'sociaal'],
  'angstcoaching': ['angst', 'sociaal'],
  'netwerken': ['netwerken', 'sociaal'],
  'communicatie': ['communicatie', 'sociaal'],
  'communicatiecoaching': ['communicatie', 'sociaal'],
  'spreekangst': ['angst', 'communicatie'],

  // relatie / gezin
  'relatie': ['relatie'],
  'relatiecoaching': ['relatie'],
  'relatiecoach': ['relatie'],
  'gezin': ['gezin', 'relatie'],
  'gezinscoaching': ['gezin', 'relatie'],
  'scheiding': ['relatie', 'gezin'],
  'echtscheiding': ['relatie', 'gezin'],
  'zelfliefde': ['zelfliefde', 'relatie'],
  'zelfacceptatie': ['zelfliefde'],
  'zelfzorg': ['zelfliefde', 'gezondheid'],

  // financieel / ondernemerschap
  'financieel': ['financieel'],
  'financiele coaching': ['financieel'],
  'geldcoaching': ['financieel'],
  'ondernemer': ['ondernemerschap', 'financieel'],
  'ondernemerschap': ['ondernemerschap', 'financieel'],
  'business coaching': ['ondernemerschap', 'leiderschap'],
  'business coach': ['ondernemerschap', 'leiderschap'],
  'startups': ['ondernemerschap'],
  'doelen': ['doelen'],
  'doelstellingen': ['doelen'],

  // geluk / mindfulness / persoonlijke groei
  'life coaching': ['geluk', 'persoonlijke groei'],
  'life coach': ['geluk', 'persoonlijke groei'],
  'persoonlijke groei': ['persoonlijke groei', 'geluk'],
  'persoonlijke ontwikkeling': ['persoonlijke groei', 'geluk'],
  'personal coaching': ['persoonlijke groei', 'geluk'],
  'personal coach': ['persoonlijke groei', 'geluk'],
  'mindfulness': ['mindfulness', 'geluk'],
  'meditatie': ['mindfulness', 'geluk'],
  'nlp': ['persoonlijke groei', 'geluk'],
  'nlp coaching': ['persoonlijke groei', 'geluk'],
  'nlp coach': ['persoonlijke groei', 'geluk'],
  'mental coaching': ['geluk', 'persoonlijke groei'],
  'mental coach': ['geluk', 'persoonlijke groei'],
  'psychologie': ['persoonlijke groei'],
  'geluk': ['geluk'],
  'gelukscoaching': ['geluk'],
  'zingeving': ['geluk', 'persoonlijke groei'],
  'levenscoaching': ['geluk', 'persoonlijke groei'],

  // gezondheid / lifestyle
  'gezondheid': ['gezondheid'],
  'gezondheidscoaching': ['gezondheid'],
  'health coaching': ['gezondheid'],
  'health coach': ['gezondheid'],
  'lifestyle': ['lifestyle', 'gezondheid'],
  'lifestyle coaching': ['lifestyle', 'gezondheid'],
  'energie': ['energie', 'gezondheid'],
  'vitaliteit': ['energie', 'gezondheid'],
  'balans': ['balans', 'gezondheid'],
  'werk-privébalans': ['balans', 'werk'],
  'werk-prive balans': ['balans', 'werk'],
  'voeding': ['gezondheid', 'lifestyle'],
  'sport': ['gezondheid', 'lifestyle'],
  'beweging': ['gezondheid', 'lifestyle'],

  // praktisch / productiviteit
  'timemanagement': ['timemanagement', 'praktisch'],
  'time management': ['timemanagement', 'praktisch'],
  'productiviteit': ['productiviteit', 'praktisch'],
  'organisatie': ['praktisch'],
  'planning': ['praktisch', 'timemanagement'],
  'adhd coaching': ['praktisch'],
  'adhd': ['praktisch'],
  'autisme': ['praktisch'],
};

/**
 * Normalize an array of raw specialty strings to deduplicated taxonomy slugs.
 * @param {string[]} rawArray
 * @returns {string[]}
 */
export function normalizeSpecialties(rawArray) {
  if (!Array.isArray(rawArray) || rawArray.length === 0) return [];

  const result = new Set();

  for (const raw of rawArray) {
    const key = raw.toLowerCase().trim();
    const mapped = SPECIALTY_MAP[key];
    if (mapped) {
      mapped.forEach((s) => result.add(s));
    } else {
      // Fall back: keep as-is if not in map (lowercased)
      result.add(key);
    }
  }

  return Array.from(result);
}

// Maps common Dutch city name variants to the canonical name
const CITY_MAP = {
  '\'s-gravenhage': 'Den Haag',
  's-gravenhage': 'Den Haag',
  'den haag': 'Den Haag',
  'the hague': 'Den Haag',
  '\'s-hertogenbosch': 'Den Bosch',
  's-hertogenbosch': 'Den Bosch',
  'hertogenbosch': 'Den Bosch',
  'den bosch': 'Den Bosch',
  'amsterdam-zuidoost': 'Amsterdam',
  'amsterdam zuidoost': 'Amsterdam',
  'amsterdam noord': 'Amsterdam',
  'amsterdam west': 'Amsterdam',
  'amsterdam oost': 'Amsterdam',
  'rotterdam centrum': 'Rotterdam',
  'utrecht centrum': 'Utrecht',
  'eindhoven centrum': 'Eindhoven',
};

/**
 * Normalize a raw city string to its canonical Dutch city name.
 * @param {string} rawCity
 * @returns {string}
 */
export function normalizeCity(rawCity) {
  if (!rawCity) return '';

  const key = rawCity.toLowerCase().trim();
  return CITY_MAP[key] || rawCity.trim();
}
