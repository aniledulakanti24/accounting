/**
 * Items & Inventory service — mock data.
 */

export const ITEM_GROUPS = ['Clever Sweetener', 'Stevia Sweetener', 'Monk Fruit', 'Erythritol', 'Sucralose', 'Aspartame', 'Sugar Free Blend', 'Extract', 'Bulk Ingredient', 'Service']
export const UOM_LIST    = ['Pcs', 'Box', 'Kg', 'Gm', 'Bottle', 'Pouch', 'Carton', 'Pack', 'Bag', 'Sachet']

/* ── Inventory Items ──
 * Catalog modelled on Nclever India Pvt Ltd (indiamart.com/nclever-india).
 * Clever Sweetener "x" series = sweetness multiplier vs table sugar.
 */
const ITEMS_SEED = [
  /* ── Clever Sweetener concentrate series ── */
  { id:'I001', code:'CLV-SW-10X',   name:'Clever Sweetener 10x',                     group:'Clever Sweetener', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:600,  openingVal:480000,  currentQty:412,  reorderQty:120, salePrice:1100, purchasePrice:780,  status:'active' },
  { id:'I002', code:'CLV-SW-100X',  name:'Clever Sweetener 100x',                    group:'Clever Sweetener', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:480,  openingVal:624000,  currentQty:268,  reorderQty:100, salePrice:1850, purchasePrice:1300, status:'active' },
  { id:'I003', code:'CLV-SW-200X',  name:'Clever Sweetener 200x',                    group:'Clever Sweetener', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:360,  openingVal:594000,  currentQty:155,  reorderQty:90,  salePrice:2400, purchasePrice:1650, status:'active' },
  { id:'I004', code:'CLV-SW-400X',  name:'Clever Sweetener 400x',                    group:'Clever Sweetener', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:300,  openingVal:660000,  currentQty:118,  reorderQty:80,  salePrice:2950, purchasePrice:2200, status:'active' },
  { id:'I005', code:'CLV-SW-500X',  name:'Clever Sweetener 500x',                    group:'Clever Sweetener', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:280,  openingVal:700000,  currentQty:96,   reorderQty:75,  salePrice:3300, purchasePrice:2500, status:'active' },
  { id:'I006', code:'CLV-SW-700X',  name:'Clever Sweetener 700x',                    group:'Clever Sweetener', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:220,  openingVal:660000,  currentQty:64,   reorderQty:60,  salePrice:3900, purchasePrice:3000, status:'active' },
  { id:'I007', code:'CLV-SW-900X',  name:'Clever Sweetener 900x',                    group:'Clever Sweetener', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:180,  openingVal:630000,  currentQty:52,   reorderQty:50,  salePrice:4500, purchasePrice:3500, status:'active' },
  { id:'I008', code:'CLV-SW-1500X', name:'Clever Sweetener 1500x',                   group:'Clever Sweetener', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:140,  openingVal:700000,  currentQty:38,   reorderQty:40,  salePrice:6200, purchasePrice:4800, status:'active' },
  { id:'I009', code:'CLV-SW-2000X', name:'Clever Sweetener 2000x',                   group:'Clever Sweetener', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:110,  openingVal:660000,  currentQty:71,   reorderQty:35,  salePrice:7400, purchasePrice:5800, status:'active' },

  /* ── Stevia ── */
  { id:'I010', code:'CLV-STV-400G', name:'Clever Stevia Low Calorie Sugar 400gm',    group:'Stevia Sweetener', uom:'Pcs',    hsn:'21069099', gstRate:18, openingQty:2200, openingVal:286000,  currentQty:1340, reorderQty:400, salePrice:175,  purchasePrice:115,  status:'active' },
  { id:'I011', code:'STV-PURE-500', name:'Stevia Pure Low Calorie Sweetener 500gm',  group:'Stevia Sweetener', uom:'Pcs',    hsn:'21069099', gstRate:18, openingQty:1600, openingVal:240000,  currentQty:880,  reorderQty:320, salePrice:210,  purchasePrice:140,  status:'active' },
  { id:'I012', code:'STV-EXT',      name:'Stevia Extract (RA 98%)',                  group:'Extract',          uom:'Kg',     hsn:'13021919', gstRate:18, openingQty:120,  openingVal:540000,  currentQty:58,   reorderQty:25,  salePrice:6500, purchasePrice:4200, status:'active' },

  /* ── Monk Fruit ── */
  { id:'I013', code:'MF-NAT-1-1',   name:'Monk Fruit Natural Sweetener 1:1',         group:'Monk Fruit',       uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:520,  openingVal:546000,  currentQty:268,  reorderQty:120, salePrice:1250, purchasePrice:820,  status:'active' },
  { id:'I014', code:'MF-NAT-1-5',   name:'Monk Fruit Natural Sweetener 1:5',         group:'Monk Fruit',       uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:400,  openingVal:560000,  currentQty:172,  reorderQty:90,  salePrice:1650, purchasePrice:1150, status:'active' },
  { id:'I015', code:'MF-NAT-1-10',  name:'Monk Fruit Natural Sweetener 1:10',        group:'Monk Fruit',       uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:320,  openingVal:512000,  currentQty:94,   reorderQty:80,  salePrice:2100, purchasePrice:1500, status:'active' },
  { id:'I016', code:'MF-MV-10',     name:'Monk Fruit Extract Powder MV-10%',         group:'Extract',          uom:'Kg',     hsn:'13021919', gstRate:18, openingQty:160,  openingVal:720000,  currentQty:76,   reorderQty:30,  salePrice:6800, purchasePrice:4500, status:'active' },
  { id:'I017', code:'MF-MV-17',     name:'Monk Fruit Extract Powder MV-17%',         group:'Extract',          uom:'Kg',     hsn:'13021919', gstRate:18, openingQty:120,  openingVal:660000,  currentQty:48,   reorderQty:25,  salePrice:8200, purchasePrice:5600, status:'active' },

  /* ── Erythritol ── */
  { id:'I018', code:'ERY-BULK',     name:'Erythritol Natural Sweetener',             group:'Erythritol',       uom:'Kg',     hsn:'29054900', gstRate:18, openingQty:900,  openingVal:540000,  currentQty:430,  reorderQty:200, salePrice:780,  purchasePrice:520,  status:'active' },

  /* ── Sugar Free Blends (Clever Stevia ratios) ── */
  { id:'I019', code:'CLV-STV-1-2',  name:'Clever Stevia Low Calorie Sugar 1:2',      group:'Sugar Free Blend', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:420,  openingVal:336000,  currentQty:236,  reorderQty:100, salePrice:980,  purchasePrice:680,  status:'active' },
  { id:'I020', code:'CLV-STV-1-20', name:'Clever Stevia Low Calorie Sugar 1:20',     group:'Sugar Free Blend', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:300,  openingVal:420000,  currentQty:118,  reorderQty:80,  salePrice:1750, purchasePrice:1200, status:'active' },
  { id:'I021', code:'CLV-STV-1-50', name:'Clever Stevia Low Calorie Sugar 1:50',     group:'Sugar Free Blend', uom:'Kg',     hsn:'21069099', gstRate:18, openingQty:200,  openingVal:460000,  currentQty:62,   reorderQty:50,  salePrice:2650, purchasePrice:1900, status:'active' },

  /* ── Sucralose & Aspartame ── */
  { id:'I022', code:'SUCRALOSE',    name:'Sucralose Powder',                         group:'Sucralose',        uom:'Kg',     hsn:'29420090', gstRate:18, openingQty:260,  openingVal:728000,  currentQty:148,  reorderQty:60,  salePrice:3400, purchasePrice:2450, status:'active' },
  { id:'I023', code:'ASPARTAME',    name:'Aspartame Sweetener',                      group:'Aspartame',        uom:'Kg',     hsn:'29242930', gstRate:18, openingQty:240,  openingVal:432000,  currentQty:96,   reorderQty:55,  salePrice:2200, purchasePrice:1550, status:'active' },

  /* ── B2B bulk + services ── */
  { id:'I024', code:'BULK-STV-25KG',name:'Stevia Blend Bulk Bag 25kg',               group:'Bulk Ingredient',  uom:'Bag',    hsn:'21069099', gstRate:18, openingQty:160,  openingVal:400000,  currentQty:54,   reorderQty:30,  salePrice:3200, purchasePrice:2200, status:'active' },
  { id:'I025', code:'MFG-TOLL',     name:'Third Party Sweetener Manufacturing',      group:'Service',          uom:'Pcs',    hsn:'998816',   gstRate:18, openingQty:0,    openingVal:0,       currentQty:0,    reorderQty:0,   salePrice:12500,purchasePrice:0,    status:'active' },
]

const ITEM_WORKFLOW_EXTRAS = {
  I001: { sku:'CLV-SW-10X', barcode:'890950510010', preferredVendor:'Nclever India Plant', brand:'Clever', tracking:'Batch', batch:'SW10-2601', expiry:'2028-03-31', reorderStatus:'Healthy', minOrderQty:150, leadTimeDays:6, warehouse:'Finished Goods Store', image:'Clever 10x' },
  I002: { sku:'CLV-SW-100X', barcode:'890950510100', preferredVendor:'Nclever India Plant', brand:'Clever', tracking:'Batch', batch:'SW100-2601', expiry:'2028-03-31', reorderStatus:'Healthy', minOrderQty:120, leadTimeDays:6, warehouse:'Finished Goods Store', image:'Clever 100x' },
  I005: { sku:'CLV-SW-500X', barcode:'890950510500', preferredVendor:'Nclever India Plant', brand:'Clever', tracking:'Batch', batch:'SW500-2601', expiry:'2028-02-28', reorderStatus:'Reorder soon', minOrderQty:90, leadTimeDays:7, warehouse:'Finished Goods Store', image:'Clever 500x' },
  I008: { sku:'CLV-SW-1500X', barcode:'890950511500', preferredVendor:'Nclever India Plant', brand:'Clever', tracking:'Batch', batch:'SW1500-2601', expiry:'2028-02-28', reorderStatus:'Reorder soon', minOrderQty:50, leadTimeDays:8, warehouse:'Finished Goods Store', image:'Clever 1500x' },
  I010: { sku:'CLV-STV-400G', barcode:'890950510400', preferredVendor:'Nclever India Plant', brand:'Clever Stevia', tracking:'Batch', batch:'STV400-2601', expiry:'2027-12-31', reorderStatus:'Healthy', minOrderQty:480, leadTimeDays:5, warehouse:'E-commerce Dispatch Store', image:'Stevia 400g' },
  I011: { sku:'STV-PURE-500', barcode:'890950510055', preferredVendor:'Nclever India Plant', brand:'Stevia Pure', tracking:'Batch', batch:'STVP500-2601', expiry:'2027-12-31', reorderStatus:'Healthy', minOrderQty:360, leadTimeDays:5, warehouse:'E-commerce Dispatch Store', image:'Stevia Pure' },
  I012: { sku:'STV-EXT', barcode:'890950510120', preferredVendor:'Stevia Import Desk', brand:'Clever Extract', tracking:'Batch', batch:'STVEXT-2601', expiry:'2028-06-30', reorderStatus:'Healthy', minOrderQty:25, leadTimeDays:21, warehouse:'Raw Ingredient Store', image:'Stevia Extract' },
  I013: { sku:'MF-NAT-1-1', barcode:'890950510131', preferredVendor:'Monk Fruit Import Desk', brand:'Clever Monk Fruit', tracking:'Batch', batch:'MF11-2601', expiry:'2028-01-31', reorderStatus:'Healthy', minOrderQty:120, leadTimeDays:18, warehouse:'Blending Room', image:'Monk Fruit 1:1' },
  I016: { sku:'MF-MV-10', barcode:'890950510160', preferredVendor:'Monk Fruit Import Desk', brand:'Clever Monk Fruit', tracking:'Batch', batch:'MFMV10-2601', expiry:'2028-04-30', reorderStatus:'Healthy', minOrderQty:30, leadTimeDays:21, warehouse:'Raw Ingredient Store', image:'Monk Fruit MV-10%' },
  I017: { sku:'MF-MV-17', barcode:'890950510170', preferredVendor:'Monk Fruit Import Desk', brand:'Clever Monk Fruit', tracking:'Batch', batch:'MFMV17-2601', expiry:'2028-04-30', reorderStatus:'Reorder soon', minOrderQty:25, leadTimeDays:21, warehouse:'Raw Ingredient Store', image:'Monk Fruit MV-17%' },
  I018: { sku:'ERY-BULK', barcode:'890950510180', preferredVendor:'Erythritol Import Desk', brand:'Clever', tracking:'Batch', batch:'ERY-2601', expiry:'2028-08-31', reorderStatus:'Healthy', minOrderQty:200, leadTimeDays:15, warehouse:'Raw Ingredient Store', image:'Erythritol' },
  I022: { sku:'SUCRALOSE', barcode:'890950510220', preferredVendor:'Speciality Chem Suppliers', brand:'Clever', tracking:'Batch', batch:'SUC-2601', expiry:'2028-05-31', reorderStatus:'Healthy', minOrderQty:60, leadTimeDays:14, warehouse:'Raw Ingredient Store', image:'Sucralose' },
  I023: { sku:'ASPARTAME', barcode:'890950510230', preferredVendor:'Speciality Chem Suppliers', brand:'Clever', tracking:'Batch', batch:'ASP-2601', expiry:'2028-05-31', reorderStatus:'Healthy', minOrderQty:55, leadTimeDays:14, warehouse:'Raw Ingredient Store', image:'Aspartame' },
  I024: { sku:'BULK-STV-25KG', barcode:'890950510240', preferredVendor:'Nclever India Plant', brand:'Clever B2B', tracking:'Batch', batch:'BSTV25-2601', expiry:'2027-12-31', reorderStatus:'Reorder soon', minOrderQty:30, leadTimeDays:7, warehouse:'Bulk Finished Store', image:'Stevia Bulk' },
}

function workflowFor(item) {
  const low = item.currentQty <= item.reorderQty && item.reorderQty > 0
  const out = item.currentQty === 0 && item.group !== 'Service'
  return {
    sku: item.code,
    barcode: '',
    preferredVendor: 'Not set',
    brand: item.group,
    tracking: item.group === 'Service' ? 'None' : 'Qty',
    batch: '-',
    expiry: '-',
    reorderStatus: out ? 'Out of stock' : low ? 'Reorder soon' : 'Healthy',
    minOrderQty: item.reorderQty,
    leadTimeDays: 7,
    warehouse: 'Main Location',
    image: item.name.slice(0, 2).toUpperCase(),
    ...(ITEM_WORKFLOW_EXTRAS[item.id] ?? {}),
  }
}

function enrichItem(item) {
  return { ...item, ...workflowFor(item) }
}

export function getItems()        { return Promise.resolve(ITEMS_SEED.map(enrichItem)) }

/* ── Godowns & Warehouses ── */
const GODOWNS_SEED = [
  { id:'G001', code:'FG-STORE', name:'Finished Goods Store',        location:'Delhi NCR - Dispatch', type:'Main',    capacitySqFt:6000, stockValue:5240000, active:true },
  { id:'G002', code:'RAW-ING',  name:'Raw Ingredient Store',        location:'Delhi NCR - Factory',  type:'Sub',     capacitySqFt:2800, stockValue:4360000, active:true },
  { id:'G003', code:'BLEND',    name:'Blending Room',                location:'Delhi NCR - Factory',  type:'Sub',     capacitySqFt:1800, stockValue:1180000, active:true },
  { id:'G004', code:'BULK-FG',  name:'Bulk Finished Store',         location:'Delhi NCR - Factory',  type:'Main',    capacitySqFt:3200, stockValue:1620000, active:true },
  { id:'G005', code:'PKG-STORE',name:'Packaging Store',              location:'Delhi NCR - Factory',  type:'Sub',     capacitySqFt:1400, stockValue:320000,  active:true},
  { id:'G006', code:'ECOM-DSP', name:'E-commerce Dispatch Store',    location:'Delhi NCR - Office',   type:'Virtual', capacitySqFt:900,  stockValue:760000,  active:true },
]

export function getGodowns()      { return Promise.resolve([...GODOWNS_SEED]) }

/* ── Stock Movement ── */
const STOCK_MOVEMENT_SEED = [
  { id:'SM001', date:'2025-12-01', ref:'PB-2526-0023', type:'Inward',   item:'Monk Fruit Extract Powder MV-10%',      godown:'Raw Ingredient Store',     qty:40,    unit:'Kg',     rate:4500, value:180000 },
  { id:'SM002', date:'2025-12-02', ref:'MFG-2526-0088', type:'Outward',  item:'Clever Stevia Low Calorie Sugar 400gm', godown:'E-commerce Dispatch Store',qty:240,   unit:'Pcs',    rate:175,  value:42000  },
  { id:'SM003', date:'2025-12-03', ref:'TRF-001',      type:'Transfer', item:'Monk Fruit Natural Sweetener 1:1',     godown:'Blending Room to Bulk FG', qty:60,    unit:'Kg',     rate:820,  value:49200  },
  { id:'SM004', date:'2025-12-05', ref:'PB-2526-0031', type:'Inward',   item:'Erythritol Natural Sweetener',          godown:'Raw Ingredient Store',     qty:300,   unit:'Kg',     rate:520,  value:156000 },
  { id:'SM005', date:'2025-12-08', ref:'SI-2526-0094', type:'Outward',  item:'Clever Sweetener 500x',                 godown:'Finished Goods Store',     qty:30,    unit:'Kg',     rate:3300, value:99000  },
  { id:'SM006', date:'2025-12-10', ref:'SI-2526-0099', type:'Outward',  item:'Stevia Pure Low Calorie Sweetener 500gm',godown:'E-commerce Dispatch Store',qty:120,   unit:'Pcs',    rate:210,  value:25200  },
  { id:'SM007', date:'2025-12-12', ref:'PB-2526-0038', type:'Inward',   item:'Sucralose Powder',                      godown:'Raw Ingredient Store',     qty:60,    unit:'Kg',     rate:2450, value:147000 },
  { id:'SM008', date:'2025-12-14', ref:'ADJ-001',      type:'Adjust',   item:'Clever Sweetener 100x',                 godown:'Finished Goods Store',     qty:-8,    unit:'Kg',     rate:1300, value:-10400 },
  { id:'SM009', date:'2025-12-15', ref:'PB-2526-0042', type:'Inward',   item:'Monk Fruit Extract Powder MV-17%',      godown:'Raw Ingredient Store',     qty:25,    unit:'Kg',     rate:5600, value:140000 },
  { id:'SM010', date:'2025-12-18', ref:'SI-2526-0108', type:'Outward',  item:'Stevia Blend Bulk Bag 25kg',            godown:'Bulk Finished Store',      qty:12,    unit:'Bag',    rate:3200, value:38400  },
]

export function getStockMovements() { return Promise.resolve([...STOCK_MOVEMENT_SEED]) }

export function getItemReorderAlerts() {
  return Promise.resolve(ITEMS_SEED.map(enrichItem)
    .filter(item => item.group !== 'Service' && item.reorderQty > 0)
    .map(item => ({
      id: `RO-${item.id}`,
      code: item.code,
      name: item.name,
      currentQty: item.currentQty,
      reorderQty: item.reorderQty,
      minOrderQty: item.minOrderQty,
      uom: item.uom,
      vendor: item.preferredVendor,
      leadTimeDays: item.leadTimeDays,
      status: item.reorderStatus,
    })))
}

export function getItemBatchSerials() {
  return Promise.resolve(ITEMS_SEED.map(enrichItem)
    .filter(item => item.tracking !== 'None')
    .map(item => ({
      id: `BS-${item.id}`,
      code: item.code,
      item: item.name,
      tracking: item.tracking,
      batch: item.batch,
      warehouse: item.warehouse,
      qty: item.currentQty,
      uom: item.uom,
      expiry: item.expiry,
      status: item.expiry !== '-' ? 'expiry-tracked' : item.tracking.toLowerCase(),
    })))
}

export function getItemImportPreview() {
  return Promise.resolve([
    { id:'IIMP-001', source:'Tally Stock Item Export', file:'stock_items_tally.xlsx', rows:340, valid:311, duplicates:18, rejected:11, status:'validated', lastRun:'2026-01-08 14:20' },
    { id:'IIMP-002', source:'Vyapar Item Export', file:'vyapar_items.csv', rows:185, valid:168, duplicates:9, rejected:8, status:'needs-review', lastRun:'2026-01-07 12:05' },
    { id:'IIMP-003', source:'Excel Template', file:'sku_price_upload.xlsx', rows:92, valid:92, duplicates:0, rejected:0, status:'ready', lastRun:'2026-01-06 17:10' },
  ])
}

/* ── Item Pricing ── */
export function getItemPricing() {
  return Promise.resolve(
    ITEMS_SEED.map(enrichItem).filter(i => i.group !== 'Service').map(i => ({
      id:            i.id,
      code:          i.code,
      name:          i.name,
      group:         i.group,
      uom:           i.uom,
      salePrice:     i.salePrice,
      purchasePrice: i.purchasePrice,
      lastPurchase:  Math.round(i.purchasePrice * (1 + (Math.random() * 0.1 - 0.05))),
      margin:        i.purchasePrice > 0
        ? parseFloat((((i.salePrice - i.purchasePrice) / i.salePrice) * 100).toFixed(1))
        : null,
      gstRate: i.gstRate,
    }))
  )
}
