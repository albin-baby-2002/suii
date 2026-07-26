export interface PortfolioStock {
  /** Company display name */
  name: string;
  /** NSE trading symbol */
  nseSymbol: string;
  /** BSE scrip code */
  bseCode: string;
  /** Business sector */
  sector: string;
  /** Market capitalization category */
  marketCap: 'Large' | 'Mid' | 'Small';
  /** Google News search keywords (if different from name) */
  searchKeywords?: string[];
}

/**
 * Active portfolio — actual holdings.
 * A few recently-listed small caps (CRAMC, GROWW, WAAREEENER, DANISHPOWER,
 * VILASTRANSCORE) have their bseCode left blank — it isn't used anywhere in
 * the pipeline (only nseSymbol drives exchange-filing lookups and news
 * search), so it was left empty rather than guess at a number.
 */
export const PORTFOLIO_STOCKS: PortfolioStock[] = [
  {
    name: 'ICICI Bank',
    nseSymbol: 'ICICIBANK',
    bseCode: '532174',
    sector: 'Banking',
    marketCap: 'Large',
    searchKeywords: ['ICICI Bank'],
  },
  {
    name: 'Eternal',
    nseSymbol: 'ETERNAL',
    bseCode: '543320',
    sector: 'Internet / Food-tech',
    marketCap: 'Large',
    searchKeywords: ['Eternal Ltd', 'Zomato', 'Blinkit'],
  },
  {
    name: 'Varun Beverages',
    nseSymbol: 'VBL',
    bseCode: '540180',
    sector: 'FMCG / Beverages',
    marketCap: 'Large',
    searchKeywords: ['Varun Beverages'],
  },
  {
    name: 'Mazagon Dock Shipbuilders',
    nseSymbol: 'MAZDOCK',
    bseCode: '543237',
    sector: 'Defense / Shipbuilding',
    marketCap: 'Large',
    searchKeywords: ['Mazagon Dock Shipbuilders', 'Mazagon Dock'],
  },
  {
    name: 'Waaree Energies',
    nseSymbol: 'WAAREEENER',
    bseCode: '',
    sector: 'Renewable Energy (Solar Modules)',
    marketCap: 'Large',
    searchKeywords: ['Waaree Energies'],
  },
  {
    name: 'Groww',
    nseSymbol: 'GROWW',
    bseCode: '',
    sector: 'Fintech / Broking',
    marketCap: 'Large',
    searchKeywords: ['Groww', 'Billionbrains Garage Ventures'],
  },
  {
    name: 'Polycab India',
    nseSymbol: 'POLYCAB',
    bseCode: '542652',
    sector: 'Cables & Wires',
    marketCap: 'Large',
    searchKeywords: ['Polycab India', 'Polycab'],
  },
  {
    name: 'Cholamandalam Investment and Finance',
    nseSymbol: 'CHOLAFIN',
    bseCode: '511243',
    sector: 'NBFC',
    marketCap: 'Large',
    searchKeywords: ['Cholamandalam Investment', 'Chola Finance', 'Cholamandalam'],
  },
  {
    name: 'Coforge',
    nseSymbol: 'COFORGE',
    bseCode: '532541',
    sector: 'IT Services',
    marketCap: 'Mid',
    searchKeywords: ['Coforge'],
  },
  {
    name: 'HDFC Asset Management Company',
    nseSymbol: 'HDFCAMC',
    bseCode: '541730',
    sector: 'Asset Management',
    marketCap: 'Mid',
    searchKeywords: ['HDFC Asset Management', 'HDFC AMC'],
  },
  {
    name: 'AU Small Finance Bank',
    nseSymbol: 'AUBANK',
    bseCode: '540611',
    sector: 'Banking (SFB)',
    marketCap: 'Mid',
    searchKeywords: ['AU Small Finance Bank', 'AU Bank'],
  },
  {
    name: 'CAMS',
    nseSymbol: 'CAMS',
    bseCode: '543232',
    sector: 'Financial Services (RTA)',
    marketCap: 'Mid',
    searchKeywords: ['CAMS', 'Computer Age Management Services'],
  },
  {
    name: 'KFin Technologies',
    nseSymbol: 'KFINTECH',
    bseCode: '543720',
    sector: 'Financial Services (RTA)',
    marketCap: 'Mid',
    searchKeywords: ['KFin Technologies', 'KFintech'],
  },
  {
    name: 'Nippon Life India Asset Management',
    nseSymbol: 'NAM-INDIA',
    bseCode: '540767',
    sector: 'Asset Management',
    marketCap: 'Mid',
    searchKeywords: ['Nippon Life India Asset Management', 'Nippon India Mutual Fund', 'NAM India'],
  },
  {
    name: 'Canara Robeco Asset Management Company',
    nseSymbol: 'CRAMC',
    bseCode: '',
    sector: 'Asset Management',
    marketCap: 'Mid',
    searchKeywords: ['Canara Robeco Asset Management', 'Canara Robeco AMC'],
  },
  {
    name: 'KPIT Technologies',
    nseSymbol: 'KPITTECH',
    bseCode: '542651',
    sector: 'IT / Automotive Software',
    marketCap: 'Mid',
    searchKeywords: ['KPIT Technologies', 'KPIT'],
  },
  {
    name: 'Aptus Value Housing Finance India',
    nseSymbol: 'APTUS',
    bseCode: '543335',
    sector: 'Housing Finance',
    marketCap: 'Mid',
    searchKeywords: ['Aptus Value Housing Finance', 'Aptus Housing'],
  },
  {
    name: 'JSW Infrastructure',
    nseSymbol: 'JSWINFRA',
    bseCode: '543994',
    sector: 'Ports & Infrastructure',
    marketCap: 'Mid',
    searchKeywords: ['JSW Infrastructure'],
  },
  {
    name: 'Welspun Corp',
    nseSymbol: 'WELCORP',
    bseCode: '526367',
    sector: 'Steel Pipes',
    marketCap: 'Mid',
    searchKeywords: ['Welspun Corp'],
  },
  {
    name: 'KEI Industries',
    nseSymbol: 'KEI',
    bseCode: '517569',
    sector: 'Cables & Wires',
    marketCap: 'Mid',
    searchKeywords: ['KEI Industries'],
  },
  // --- Small Cap ---
  {
    name: 'Ujjivan Small Finance Bank',
    nseSymbol: 'UJJIVANSFB',
    bseCode: '542904',
    sector: 'Banking (SFB)',
    marketCap: 'Small',
    searchKeywords: ['Ujjivan Small Finance Bank', 'Ujjivan SFB'],
  },
  {
    name: 'Waaree Renewable Technologies',
    nseSymbol: 'WAAREERTL',
    bseCode: '533029',
    sector: 'Renewable Energy (EPC)',
    marketCap: 'Small',
    searchKeywords: ['Waaree Renewable Technologies'],
  },
  {
    name: 'RateGain Travel Technologies',
    nseSymbol: 'RATEGAIN',
    bseCode: '543417',
    sector: 'Travel Tech / SaaS',
    marketCap: 'Small',
    searchKeywords: ['RateGain Travel Technologies', 'RateGain'],
  },
  {
    name: 'Yatharth Hospital & Trauma Care Services',
    nseSymbol: 'YATHARTH',
    bseCode: '543990',
    sector: 'Healthcare',
    marketCap: 'Small',
    searchKeywords: ['Yatharth Hospital'],
  },
  {
    name: 'Venus Pipes & Tubes',
    nseSymbol: 'VENUSPIPES',
    bseCode: '543926',
    sector: 'Pipes & Tubes',
    marketCap: 'Small',
    searchKeywords: ['Venus Pipes'],
  },
  {
    name: 'Danish Power',
    nseSymbol: 'DANISHPOWER',
    bseCode: '',
    sector: 'Power Equipment (Transformers)',
    marketCap: 'Small',
    searchKeywords: ['Danish Power'],
  },
  {
    name: 'Vilas Transcore',
    nseSymbol: 'VILASTRANSCORE',
    bseCode: '',
    sector: 'Power Equipment (Transformer Cores)',
    marketCap: 'Small',
    searchKeywords: ['Vilas Transcore'],
  },
];
