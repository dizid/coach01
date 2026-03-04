/**
 * Top 150 Dutch municipalities by population with province and center coordinates.
 * Used by Google Places collector (expanded city search) and province enricher.
 * Source: CBS population data 2025
 */

export const MUNICIPALITIES = [
  // Noord-Holland
  { name: 'Amsterdam', province: 'Noord-Holland', lat: 52.3676, lng: 4.9041 },
  { name: 'Haarlem', province: 'Noord-Holland', lat: 52.3874, lng: 4.6462 },
  { name: 'Almere', province: 'Flevoland', lat: 52.3508, lng: 5.2647 },
  { name: 'Zaanstad', province: 'Noord-Holland', lat: 52.4688, lng: 4.8270 },
  { name: 'Amstelveen', province: 'Noord-Holland', lat: 52.3011, lng: 4.8658 },
  { name: 'Alkmaar', province: 'Noord-Holland', lat: 52.6324, lng: 4.7534 },
  { name: 'Hilversum', province: 'Noord-Holland', lat: 52.2292, lng: 5.1765 },
  { name: 'Purmerend', province: 'Noord-Holland', lat: 52.5055, lng: 4.9600 },
  { name: 'Hoorn', province: 'Noord-Holland', lat: 52.6427, lng: 5.0597 },
  { name: 'Heerhugowaard', province: 'Noord-Holland', lat: 52.6633, lng: 4.8358 },
  { name: 'Den Helder', province: 'Noord-Holland', lat: 52.9534, lng: 4.7603 },
  { name: 'Hoofddorp', province: 'Noord-Holland', lat: 52.3029, lng: 4.6909 },
  { name: 'Velsen', province: 'Noord-Holland', lat: 52.4578, lng: 4.6317 },
  { name: 'Diemen', province: 'Noord-Holland', lat: 52.3395, lng: 4.9594 },
  { name: 'Beverwijk', province: 'Noord-Holland', lat: 52.4850, lng: 4.6558 },
  { name: 'Castricum', province: 'Noord-Holland', lat: 52.5533, lng: 4.6739 },
  { name: 'Uithoorn', province: 'Noord-Holland', lat: 52.2375, lng: 4.8275 },
  { name: 'Heemskerk', province: 'Noord-Holland', lat: 52.5080, lng: 4.6706 },
  { name: 'Enkhuizen', province: 'Noord-Holland', lat: 52.7044, lng: 5.2886 },

  // Zuid-Holland
  { name: 'Rotterdam', province: 'Zuid-Holland', lat: 51.9244, lng: 4.4777 },
  { name: 'Den Haag', province: 'Zuid-Holland', lat: 52.0705, lng: 4.3007 },
  { name: 'Leiden', province: 'Zuid-Holland', lat: 52.1601, lng: 4.4970 },
  { name: 'Dordrecht', province: 'Zuid-Holland', lat: 51.8133, lng: 4.6736 },
  { name: 'Zoetermeer', province: 'Zuid-Holland', lat: 52.0575, lng: 4.4935 },
  { name: 'Delft', province: 'Zuid-Holland', lat: 52.0116, lng: 4.3571 },
  { name: 'Gouda', province: 'Zuid-Holland', lat: 52.0175, lng: 4.7065 },
  { name: 'Leidschendam', province: 'Zuid-Holland', lat: 52.0848, lng: 4.3875 },
  { name: 'Alphen aan den Rijn', province: 'Zuid-Holland', lat: 52.1296, lng: 4.6561 },
  { name: 'Schiedam', province: 'Zuid-Holland', lat: 51.9189, lng: 4.4033 },
  { name: 'Vlaardingen', province: 'Zuid-Holland', lat: 51.9129, lng: 4.3490 },
  { name: 'Spijkenisse', province: 'Zuid-Holland', lat: 51.8451, lng: 4.3289 },
  { name: 'Capelle aan den IJssel', province: 'Zuid-Holland', lat: 51.9297, lng: 4.5786 },
  { name: 'Ridderkerk', province: 'Zuid-Holland', lat: 51.8727, lng: 4.6011 },
  { name: 'Rijswijk', province: 'Zuid-Holland', lat: 52.0365, lng: 4.3283 },
  { name: 'Gorinchem', province: 'Zuid-Holland', lat: 51.8346, lng: 4.9735 },
  { name: 'Katwijk', province: 'Zuid-Holland', lat: 52.2005, lng: 4.4083 },
  { name: 'Wassenaar', province: 'Zuid-Holland', lat: 52.1463, lng: 4.4005 },
  { name: 'Barendrecht', province: 'Zuid-Holland', lat: 51.8568, lng: 4.5356 },
  { name: 'Papendrecht', province: 'Zuid-Holland', lat: 51.8312, lng: 4.6905 },
  { name: 'Lisse', province: 'Zuid-Holland', lat: 52.2601, lng: 4.5580 },
  { name: 'Voorburg', province: 'Zuid-Holland', lat: 52.0687, lng: 4.3631 },
  { name: 'Waddinxveen', province: 'Zuid-Holland', lat: 52.0416, lng: 4.6464 },

  // Utrecht
  { name: 'Utrecht', province: 'Utrecht', lat: 52.0907, lng: 5.1214 },
  { name: 'Amersfoort', province: 'Utrecht', lat: 52.1561, lng: 5.3878 },
  { name: 'Zeist', province: 'Utrecht', lat: 52.0909, lng: 5.2325 },
  { name: 'Nieuwegein', province: 'Utrecht', lat: 52.0321, lng: 5.0828 },
  { name: 'Veenendaal', province: 'Utrecht', lat: 52.0253, lng: 5.5584 },
  { name: 'Houten', province: 'Utrecht', lat: 52.0298, lng: 5.1682 },
  { name: 'IJsselstein', province: 'Utrecht', lat: 52.0211, lng: 5.0432 },
  { name: 'Woerden', province: 'Utrecht', lat: 52.0861, lng: 4.8843 },
  { name: 'Bilthoven', province: 'Utrecht', lat: 52.1295, lng: 5.2034 },
  { name: 'Soest', province: 'Utrecht', lat: 52.1744, lng: 5.2919 },
  { name: 'Bunnik', province: 'Utrecht', lat: 52.0652, lng: 5.1954 },
  { name: 'Driebergen', province: 'Utrecht', lat: 52.0520, lng: 5.2860 },

  // Noord-Brabant
  { name: 'Eindhoven', province: 'Noord-Brabant', lat: 51.4416, lng: 5.4697 },
  { name: 'Tilburg', province: 'Noord-Brabant', lat: 51.5555, lng: 5.0913 },
  { name: 'Breda', province: 'Noord-Brabant', lat: 51.5719, lng: 4.7683 },
  { name: 'Den Bosch', province: 'Noord-Brabant', lat: 51.6978, lng: 5.3037 },
  { name: 'Oss', province: 'Noord-Brabant', lat: 51.7650, lng: 5.5183 },
  { name: 'Roosendaal', province: 'Noord-Brabant', lat: 51.5309, lng: 4.4590 },
  { name: 'Helmond', province: 'Noord-Brabant', lat: 51.4758, lng: 5.6611 },
  { name: 'Bergen op Zoom', province: 'Noord-Brabant', lat: 51.4949, lng: 4.2883 },
  { name: 'Waalwijk', province: 'Noord-Brabant', lat: 51.6855, lng: 5.0713 },
  { name: 'Veldhoven', province: 'Noord-Brabant', lat: 51.4190, lng: 5.4052 },
  { name: 'Uden', province: 'Noord-Brabant', lat: 51.6587, lng: 5.6185 },
  { name: 'Meierijstad', province: 'Noord-Brabant', lat: 51.6375, lng: 5.5547 },
  { name: 'Boxtel', province: 'Noord-Brabant', lat: 51.5899, lng: 5.3255 },
  { name: 'Dongen', province: 'Noord-Brabant', lat: 51.6267, lng: 4.9402 },
  { name: 'Best', province: 'Noord-Brabant', lat: 51.5087, lng: 5.3925 },
  { name: 'Woensdrecht', province: 'Noord-Brabant', lat: 51.4273, lng: 4.3010 },

  // Gelderland
  { name: 'Arnhem', province: 'Gelderland', lat: 51.9851, lng: 5.8987 },
  { name: 'Nijmegen', province: 'Gelderland', lat: 51.8126, lng: 5.8372 },
  { name: 'Apeldoorn', province: 'Gelderland', lat: 52.2112, lng: 5.9699 },
  { name: 'Ede', province: 'Gelderland', lat: 52.0393, lng: 5.6535 },
  { name: 'Deventer', province: 'Overijssel', lat: 52.2554, lng: 6.1600 },
  { name: 'Doetinchem', province: 'Gelderland', lat: 51.9650, lng: 6.2907 },
  { name: 'Wageningen', province: 'Gelderland', lat: 51.9692, lng: 5.6653 },
  { name: 'Tiel', province: 'Gelderland', lat: 51.8861, lng: 5.4261 },
  { name: 'Harderwijk', province: 'Gelderland', lat: 52.3407, lng: 5.6164 },
  { name: 'Culemborg', province: 'Gelderland', lat: 51.9554, lng: 5.2283 },
  { name: 'Barneveld', province: 'Gelderland', lat: 52.1415, lng: 5.5864 },
  { name: 'Zutphen', province: 'Gelderland', lat: 52.1395, lng: 6.2003 },
  { name: 'Winterswijk', province: 'Gelderland', lat: 51.9716, lng: 6.7189 },
  { name: 'Elburg', province: 'Gelderland', lat: 52.4434, lng: 5.8382 },
  { name: 'Nunspeet', province: 'Gelderland', lat: 52.3764, lng: 5.7837 },

  // Overijssel
  { name: 'Enschede', province: 'Overijssel', lat: 52.2215, lng: 6.8937 },
  { name: 'Zwolle', province: 'Overijssel', lat: 52.5168, lng: 6.0830 },
  { name: 'Hengelo', province: 'Overijssel', lat: 52.2617, lng: 6.7941 },
  { name: 'Almelo', province: 'Overijssel', lat: 52.3570, lng: 6.6625 },
  { name: 'Kampen', province: 'Overijssel', lat: 52.5558, lng: 5.9109 },
  { name: 'Oldenzaal', province: 'Overijssel', lat: 52.3138, lng: 6.9293 },
  { name: 'Raalte', province: 'Overijssel', lat: 52.3845, lng: 6.2753 },
  { name: 'Steenwijk', province: 'Overijssel', lat: 52.7878, lng: 6.1173 },

  // Limburg
  { name: 'Maastricht', province: 'Limburg', lat: 50.8514, lng: 5.6910 },
  { name: 'Heerlen', province: 'Limburg', lat: 50.8883, lng: 5.9796 },
  { name: 'Venlo', province: 'Limburg', lat: 51.3704, lng: 6.1724 },
  { name: 'Sittard', province: 'Limburg', lat: 51.0010, lng: 5.8689 },
  { name: 'Roermond', province: 'Limburg', lat: 51.1942, lng: 5.9861 },
  { name: 'Weert', province: 'Limburg', lat: 51.2536, lng: 5.7068 },
  { name: 'Kerkrade', province: 'Limburg', lat: 50.8657, lng: 6.0634 },
  { name: 'Brunssum', province: 'Limburg', lat: 50.9440, lng: 5.9680 },
  { name: 'Venray', province: 'Limburg', lat: 51.5259, lng: 5.9767 },
  { name: 'Geleen', province: 'Limburg', lat: 50.9732, lng: 5.8280 },

  // Groningen
  { name: 'Groningen', province: 'Groningen', lat: 53.2194, lng: 6.5665 },
  { name: 'Stadskanaal', province: 'Groningen', lat: 52.9889, lng: 6.9497 },
  { name: 'Veendam', province: 'Groningen', lat: 53.1064, lng: 6.8775 },
  { name: 'Winschoten', province: 'Groningen', lat: 53.1449, lng: 7.0350 },
  { name: 'Hoogezand', province: 'Groningen', lat: 53.1600, lng: 6.7607 },
  { name: 'Delfzijl', province: 'Groningen', lat: 53.3279, lng: 6.9194 },

  // Friesland
  { name: 'Leeuwarden', province: 'Friesland', lat: 53.2012, lng: 5.7999 },
  { name: 'Drachten', province: 'Friesland', lat: 53.1050, lng: 6.1030 },
  { name: 'Sneek', province: 'Friesland', lat: 53.0332, lng: 5.6568 },
  { name: 'Heerenveen', province: 'Friesland', lat: 52.9600, lng: 5.9222 },
  { name: 'Harlingen', province: 'Friesland', lat: 53.1742, lng: 5.4233 },

  // Drenthe
  { name: 'Assen', province: 'Drenthe', lat: 52.9925, lng: 6.5625 },
  { name: 'Emmen', province: 'Drenthe', lat: 52.7866, lng: 6.8973 },
  { name: 'Hoogeveen', province: 'Drenthe', lat: 52.7218, lng: 6.4751 },
  { name: 'Meppel', province: 'Drenthe', lat: 52.6961, lng: 6.1938 },
  { name: 'Coevorden', province: 'Drenthe', lat: 52.6609, lng: 6.7389 },

  // Flevoland
  { name: 'Lelystad', province: 'Flevoland', lat: 52.5185, lng: 5.4714 },
  { name: 'Dronten', province: 'Flevoland', lat: 52.5282, lng: 5.7183 },
  { name: 'Zeewolde', province: 'Flevoland', lat: 52.3321, lng: 5.5421 },

  // Zeeland
  { name: 'Middelburg', province: 'Zeeland', lat: 51.4988, lng: 3.6136 },
  { name: 'Vlissingen', province: 'Zeeland', lat: 51.4425, lng: 3.5709 },
  { name: 'Goes', province: 'Zeeland', lat: 51.5038, lng: 3.8910 },
  { name: 'Terneuzen', province: 'Zeeland', lat: 51.3355, lng: 3.8276 },
];

/**
 * City-to-province lookup map (generated from MUNICIPALITIES array).
 * Used by province enricher for fast lookups.
 */
export const CITY_TO_PROVINCE = {};
for (const m of MUNICIPALITIES) {
  CITY_TO_PROVINCE[m.name] = m.province;
}

// Add common aliases that map to the same province
Object.assign(CITY_TO_PROVINCE, {
  // Den Haag / Den Bosch aliases
  '\'s-Gravenhage': 'Zuid-Holland',
  'The Hague': 'Zuid-Holland',
  '\'s-Hertogenbosch': 'Noord-Brabant',
  'Hertogenbosch': 'Noord-Brabant',

  // District names → parent city province
  'Amsterdam-Zuidoost': 'Noord-Holland',
  'Amsterdam Noord': 'Noord-Holland',
  'Amsterdam West': 'Noord-Holland',
  'Amsterdam Oost': 'Noord-Holland',
  'Rotterdam Zuid': 'Zuid-Holland',
  'Rotterdam Centrum': 'Zuid-Holland',

  // Common smaller places not in top 150 but frequently seen
  'Bussum': 'Noord-Holland',
  'Naarden': 'Noord-Holland',
  'Weesp': 'Noord-Holland',
  'Huizen': 'Noord-Holland',
  'Laren': 'Noord-Holland',
  'Blaricum': 'Noord-Holland',
  'Edam': 'Noord-Holland',
  'Volendam': 'Noord-Holland',
  'Zandvoort': 'Noord-Holland',
  'Heemstede': 'Noord-Holland',
  'Bloemendaal': 'Noord-Holland',
  'Haarlemmerliede': 'Noord-Holland',
  'Landsmeer': 'Noord-Holland',
  'Ouderkerk aan de Amstel': 'Noord-Holland',
  'Aalsmeer': 'Noord-Holland',
  'Amstelveen': 'Noord-Holland',

  'Voorschoten': 'Zuid-Holland',
  'Oegstgeest': 'Zuid-Holland',
  'Leiderdorp': 'Zuid-Holland',
  'Noordwijk': 'Zuid-Holland',
  'Sassenheim': 'Zuid-Holland',
  'Hillegom': 'Zuid-Holland',
  'Nieuwerkerk aan den IJssel': 'Zuid-Holland',
  'Krimpen aan den IJssel': 'Zuid-Holland',
  'Hendrik-Ido-Ambacht': 'Zuid-Holland',
  'Zwijndrecht': 'Zuid-Holland',
  'Sliedrecht': 'Zuid-Holland',
  'Hardinxveld-Giessendam': 'Zuid-Holland',
  'Schoonhoven': 'Zuid-Holland',
  'Bodegraven': 'Zuid-Holland',

  'Baarn': 'Utrecht',
  'De Bilt': 'Utrecht',
  'Breukelen': 'Utrecht',
  'Maarssen': 'Utrecht',
  'Vianen': 'Utrecht',
  'Leerdam': 'Utrecht',
  'Oudewater': 'Utrecht',
  'Montfoort': 'Utrecht',
  'Lopik': 'Utrecht',

  'Geldrop': 'Noord-Brabant',
  'Valkenswaard': 'Noord-Brabant',
  'Nuenen': 'Noord-Brabant',
  'Son en Breugel': 'Noord-Brabant',
  'Oisterwijk': 'Noord-Brabant',
  'Eersel': 'Noord-Brabant',
  'Bladel': 'Noord-Brabant',
  'Heusden': 'Noord-Brabant',
  'Vught': 'Noord-Brabant',
  'Drunen': 'Noord-Brabant',
  'Schijndel': 'Noord-Brabant',
  'Veghel': 'Noord-Brabant',
  'Etten-Leur': 'Noord-Brabant',
  'Oosterhout': 'Noord-Brabant',
  'Made': 'Noord-Brabant',
  'Raamsdonksveer': 'Noord-Brabant',

  'Rheden': 'Gelderland',
  'Zevenaar': 'Gelderland',
  'Duiven': 'Gelderland',
  'Westervoort': 'Gelderland',
  'Renkum': 'Gelderland',
  'Oosterbeek': 'Gelderland',
  'Doorwerth': 'Gelderland',
  'Bennekom': 'Gelderland',
  'Ermelo': 'Gelderland',
  'Putten': 'Gelderland',
  'Epe': 'Gelderland',
  'Voorst': 'Gelderland',
  'Lochem': 'Gelderland',
  'Groenlo': 'Gelderland',
  'Lichtenvoorde': 'Gelderland',
  'Borculo': 'Gelderland',
  'Neede': 'Gelderland',
  'Nijkerk': 'Gelderland',

  'Borne': 'Overijssel',
  'Rijssen': 'Overijssel',
  'Wierden': 'Overijssel',
  'Vriezenveen': 'Overijssel',
  'Dalfsen': 'Overijssel',
  'Hardenberg': 'Overijssel',
  'Ommen': 'Overijssel',

  'Landgraaf': 'Limburg',
  'Vaals': 'Limburg',
  'Valkenburg': 'Limburg',
  'Gulpen': 'Limburg',
  'Meerssen': 'Limburg',
  'Beek': 'Limburg',
  'Stein': 'Limburg',
  'Tegelen': 'Limburg',
  'Blerick': 'Limburg',

  'Bolsward': 'Friesland',
  'Franeker': 'Friesland',
  'Dokkum': 'Friesland',
  'Wolvega': 'Friesland',
  'Joure': 'Friesland',
  'Lemmer': 'Friesland',
  'Workum': 'Friesland',

  'Beilen': 'Drenthe',
  'Borger': 'Drenthe',

  'Urk': 'Flevoland',
  'Emmeloord': 'Flevoland',

  'Tholen': 'Zeeland',
  'Zierikzee': 'Zeeland',
  'Hulst': 'Zeeland',
  'Sluis': 'Zeeland',
});

/**
 * Provinces list with approximate center coordinates.
 */
export const PROVINCES = {
  'Noord-Holland': { lat: 52.52, lng: 4.94 },
  'Zuid-Holland': { lat: 51.99, lng: 4.49 },
  'Utrecht': { lat: 52.09, lng: 5.12 },
  'Noord-Brabant': { lat: 51.57, lng: 5.08 },
  'Gelderland': { lat: 52.04, lng: 5.87 },
  'Overijssel': { lat: 52.44, lng: 6.50 },
  'Limburg': { lat: 51.21, lng: 5.95 },
  'Groningen': { lat: 53.22, lng: 6.57 },
  'Friesland': { lat: 53.16, lng: 5.78 },
  'Drenthe': { lat: 52.86, lng: 6.62 },
  'Flevoland': { lat: 52.53, lng: 5.47 },
  'Zeeland': { lat: 51.50, lng: 3.61 },
};
