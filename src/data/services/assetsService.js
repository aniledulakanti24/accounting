/* ── Fixed Assets service — mock data ── */

export const ASSETS = [
  { id:'FA001', name:'Dell PowerEdge Server R750',  category:'IT Equipment',     purchaseDate:'2023-04-15', purchaseValue:1200000, method:'WDV', rate:40, accDep:720000,  netValue:480000,  location:'Server Room — Mumbai HO',  status:'active'    },
  { id:'FA002', name:'Office Furniture Set — HO',   category:'Furniture',        purchaseDate:'2022-07-01', purchaseValue:450000,  method:'SLM', rate:10, accDep:135000,  netValue:315000,  location:'Floor 4, Mumbai HO',        status:'active'    },
  { id:'FA003', name:'Daikin 5-Ton AC Unit',        category:'Plant & Machinery', purchaseDate:'2023-01-10', purchaseValue:280000,  method:'WDV', rate:15, accDep:63000,   netValue:217000,  location:'Server Room — Mumbai HO',  status:'active'    },
  { id:'FA004', name:'Company Vehicle — Innova',    category:'Vehicles',          purchaseDate:'2022-04-01', purchaseValue:2000000, method:'WDV', rate:15, accDep:487500,  netValue:1512500, location:'Mumbai HO Pool',            status:'active'    },
  { id:'FA005', name:'MacBook Pro 16" (12 units)',  category:'IT Equipment',      purchaseDate:'2024-01-15', purchaseValue:2400000, method:'WDV', rate:40, accDep:480000,  netValue:1920000, location:'Development Team',           status:'active'    },
  { id:'FA006', name:'Epson LQ-2090 Printer',       category:'IT Equipment',      purchaseDate:'2020-09-01', purchaseValue:85000,   method:'WDV', rate:40, accDep:82875,   netValue:2125,    location:'Accounts Dept',             status:'active'    },
  { id:'FA007', name:'Old Desktops — Gen 8 (5)',    category:'IT Equipment',      purchaseDate:'2019-04-01', purchaseValue:200000,  method:'WDV', rate:40, accDep:195904,  netValue:4096,    location:'Decommissioned',             status:'disposed'  },
  { id:'FA008', name:'Branch Office — Pune Fit-out',category:'Leasehold Improv',  purchaseDate:'2023-10-01', purchaseValue:850000,  method:'SLM', rate:20, accDep:141667,  netValue:708333,  location:'Pune Branch',               status:'active'    },
]
export function getAssets() { return Promise.resolve([...ASSETS]) }

export const DEPRECIATION_SCHEDULE = [
  { id:'DS001', month:'Jan 2026', assetId:'FA001', assetName:'Dell PowerEdge Server R750', method:'WDV', openingValue:480000, depAmount:16000,  closingValue:464000  },
  { id:'DS002', month:'Jan 2026', assetId:'FA002', assetName:'Office Furniture Set — HO',  method:'SLM', openingValue:315000, depAmount:3750,   closingValue:311250  },
  { id:'DS003', month:'Jan 2026', assetId:'FA003', assetName:'Daikin 5-Ton AC Unit',       method:'WDV', openingValue:217000, depAmount:2713,   closingValue:214288  },
  { id:'DS004', month:'Jan 2026', assetId:'FA004', assetName:'Company Vehicle — Innova',   method:'WDV', openingValue:1512500,depAmount:18906,  closingValue:1493594 },
  { id:'DS005', month:'Jan 2026', assetId:'FA005', assetName:'MacBook Pro 16" (12 units)', method:'WDV', openingValue:1920000,depAmount:64000,  closingValue:1856000 },
  { id:'DS006', month:'Jan 2026', assetId:'FA006', assetName:'Epson LQ-2090 Printer',      method:'WDV', openingValue:2125,   depAmount:71,     closingValue:2054    },
  { id:'DS007', month:'Jan 2026', assetId:'FA008', assetName:'Branch Office Fit-out',      method:'SLM', openingValue:708333, depAmount:14167,  closingValue:694167  },
]
export function getDepreciationSchedule(month) { return Promise.resolve([...DEPRECIATION_SCHEDULE]) }

export const DISPOSALS = [
  { id:'DIS001', date:'2025-12-15', assetId:'FA007', assetName:'Old Desktops — Gen 8 (5)', saleValue:15000, netBookValue:4096,  gainLoss:10904, method:'Sale',    status:'completed' },
]
export function getDisposals() { return Promise.resolve([...DISPOSALS]) }
