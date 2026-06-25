/** api-football team name -> openfootball country name for historical stats */
export const OPENFOOTBALL_NAME_ALIASES = {
  "Bosnia & Herzegovina": "Bosnia-Herzegovina",
  "Czechia": "Czech Republic",
  "Congo DR": "Zaire",
  "Ivory Coast": "Côte d'Ivoire",
  "Türkiye": "Turkey",
};

/** api-football team name -> /teams/countries `name` when not a direct match */
export const COUNTRY_FLAG_NAME_ALIASES = {
  "Bosnia & Herzegovina": "Bosnia",
  "Cape Verde Islands": "Cape-Verde",
  "Congo DR": "Congo-DR",
  "Czechia": "Czech-Republic",
  "Curaçao": "Curacao",
  "Ivory Coast": "Ivory-Coast",
  "South Korea": "South-Korea",
  "Türkiye": "Turkey",
};

/** ISO flag slug when /teams/countries has no entry */
export const FLAG_SLUG_BY_FIFA_CODE = {
  BIH: "ba",
  CGO: "cg",
  CPV: "cv",
  CIV: "ci",
  CUR: "cw",
  CZE: "cz",
  ENG: "gb-eng",
  KOR: "kr",
  TUR: "tr",
  USA: "us",
};

export function normalizeCountryKey(name) {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

export function openfootballName(apiName) {
  return OPENFOOTBALL_NAME_ALIASES[apiName] ?? apiName;
}

export function flagForTeam(apiName, fifaCode, countriesByKey) {
  const candidates = [apiName, COUNTRY_FLAG_NAME_ALIASES[apiName]].filter(Boolean);
  for (const candidate of candidates) {
    const country = countriesByKey.get(normalizeCountryKey(candidate));
    if (country?.flag) return country.flag;
  }
  const slug = FLAG_SLUG_BY_FIFA_CODE[fifaCode];
  return slug ? `https://media.api-sports.io/flags/${slug}.svg` : null;
}
