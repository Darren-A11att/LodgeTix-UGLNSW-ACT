// List of Grand Lodges with their countries and unique IDs
export interface GrandLodgeType {
  id: string;
  name: string;
  country: string;
  abbreviation?: string;
}

export const grandLodges: GrandLodgeType[] = [
  {
    id: 'nsw-act',
    name: 'United Grand Lodge of NSW & ACT',
    country: 'Australia',
    abbreviation: 'UGLNSW'
  },
  {
    id: 'victoria',
    name: 'United Grand Lodge of Victoria',
    country: 'Australia',
    abbreviation: 'UGLV'
  },
  {
    id: 'queensland',
    name: 'United Grand Lodge of Queensland',
    country: 'Australia',
    abbreviation: 'UGLQ'
  },
  {
    id: 'south-australia',
    name: 'Grand Lodge of South Australia & Northern Territory',
    country: 'Australia',
    abbreviation: 'GLSANT'
  },
  {
    id: 'western-australia',
    name: 'Grand Lodge of Western Australia',
    country: 'Australia',
    abbreviation: 'GLWA'
  },
  {
    id: 'tasmania',
    name: 'Grand Lodge of Tasmania',
    country: 'Australia',
    abbreviation: 'GLT'
  },
  {
    id: 'new-zealand',
    name: 'Grand Lodge of New Zealand',
    country: 'New Zealand',
    abbreviation: 'GLNZ'
  },
  {
    id: 'philippines',
    name: 'Most Worshipful Grand Lodge of Philippines',
    country: 'Philippines',
    abbreviation: 'GLP'
  },
  {
    id: 'japan',
    name: 'Most Worshipful Grand Lodge of Japan',
    country: 'Japan',
    abbreviation: 'MWGLJ'
  },
  {
    id: 'new-caledonia',
    name: 'Provincial Grand Lodge of New Caledonia',
    country: 'New Caledonia',
    abbreviation: 'PGLNC'
  },
  {
    id: 'quebec',
    name: 'Grand Lodge of Quebec',
    country: 'Canada',
    abbreviation: 'QLG'
  },
  {
    id: 'ugle',
    name: 'United Grand Lodge of England',
    country: 'England',
    abbreviation: 'UGLE'
  },
  {
    id: 'scotland',
    name: 'Grand Lodge of Scotland',
    country: 'Scotland',
    abbreviation: 'GLS'
  },
  {
    id: 'ireland',
    name: 'Grand Lodge of Ireland',
    country: 'Ireland',
    abbreviation: 'GLI'
  },
  {
    id: 'canada',
    name: 'Grand Lodge of Canada in the Province of Ontario',
    country: 'Canada',
    abbreviation: 'GLC'
  },
  {
    id: 'bc-yukon',
    name: 'Grand Lodge of British Columbia and Yukon',
    country: 'Canada',
    abbreviation: 'GLBCY'
  },
  {
    id: 'alberta',
    name: 'Grand Lodge of Alberta',
    country: 'Canada',
    abbreviation: 'GLA'
  },
  {
    id: 'saskatchewan',
    name: 'Grand Lodge of Saskatchewan',
    country: 'Canada',
    abbreviation: 'GLS'
  },
  {
    id: 'manitoba',
    name: 'Grand Lodge of Manitoba',
    country: 'Canada',
    abbreviation: 'GLM'
  },
  {
    id: 'nova-scotia',
    name: 'Grand Lodge of Nova Scotia',
    country: 'Canada',
    abbreviation: 'GLNS'
  },
  {
    id: 'new-brunswick',
    name: 'Grand Lodge of New Brunswick',
    country: 'Canada',
    abbreviation: 'GLNB'
  },
  {
    id: 'pei',
    name: 'Grand Lodge of Prince Edward Island',
    country: 'Canada',
    abbreviation: 'GLPEI'
  },
  {
    id: 'newfoundland',
    name: 'Grand Lodge of Newfoundland and Labrador',
    country: 'Canada',
    abbreviation: 'GLNL'
  },
  {
    id: 'california',
    name: 'Grand Lodge of California',
    country: 'USA',
    abbreviation: 'GLC'
  },
  {
    id: 'new-york',
    name: 'Grand Lodge of New York',
    country: 'USA',
    abbreviation: 'GLNY'
  },
  {
    id: 'texas',
    name: 'Grand Lodge of Texas',
    country: 'USA',
    abbreviation: 'GLT'
  },
  {
    id: 'pennsylvania',
    name: 'Grand Lodge of Pennsylvania',
    country: 'USA',
    abbreviation: 'GLP'
  },
  {
    id: 'illinois',
    name: 'Grand Lodge of Illinois',
    country: 'USA',
    abbreviation: 'GLI'
  },
  {
    id: 'france',
    name: 'Grand Lodge of France',
    country: 'France',
    abbreviation: 'GLF'
  },
  {
    id: 'germany',
    name: 'United Grand Lodges of Germany',
    country: 'Germany',
    abbreviation: 'UGLG'
  },
  {
    id: 'italy',
    name: 'Grand Orient of Italy',
    country: 'Italy',
    abbreviation: 'GOI'
  },
  {
    id: 'india',
    name: 'Grand Lodge of India',
    country: 'India',
    abbreviation: 'GLI'
  },
  {
    id: 'brazil',
    name: 'Grand Orient of Brazil',
    country: 'Brazil',
    abbreviation: 'GOB'
  },
  {
    id: 'south-africa',
    name: 'Grand Lodge of South Africa',
    country: 'South Africa',
    abbreviation: 'GLSA'
  }
];