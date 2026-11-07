/* ── Business Tools service — mock data ── */

export const STAFF = [
  { id:'EMP001', name:'Priya Sharma',    dept:'Finance',    designation:'Finance Lead',       salary:125000, joining:'2020-04-01', pan:'ABCPS1234D', pfUAN:'100123456789', status:'active'   },
  { id:'EMP002', name:'Rahul Mehta',     dept:'Finance',    designation:'Senior Accountant',  salary:85000,  joining:'2021-07-15', pan:'ABCPM9876F', pfUAN:'100234567890', status:'active'   },
  { id:'EMP003', name:'Ankit Rajput',    dept:'Finance',    designation:'Accountant',         salary:55000,  joining:'2022-01-10', pan:'ABCPR5678G', pfUAN:'100345678901', status:'active'   },
  { id:'EMP004', name:'Sneha Kulkarni',  dept:'Sales',      designation:'Sales Manager',      salary:95000,  joining:'2021-03-01', pan:'ABCPK7654H', pfUAN:'100456789012', status:'active'   },
  { id:'EMP005', name:'Vikram Joshi',    dept:'Operations', designation:'Ops Executive',      salary:45000,  joining:'2023-06-15', pan:'ABCPJ4321I', pfUAN:'100567890123', status:'active'   },
  { id:'EMP006', name:'Neha Patel',      dept:'HR',         designation:'HR Manager',         salary:70000,  joining:'2020-09-01', pan:'ABCPP9876J', pfUAN:'100678901234', status:'active'   },
  { id:'EMP007', name:'Suresh Nair',     dept:'IT',         designation:'System Admin',       salary:65000,  joining:'2022-04-01', pan:'ABCPN5432K', pfUAN:'100789012345', status:'active'   },
  { id:'EMP008', name:'Ravi Kumar',      dept:'Sales',      designation:'Sales Executive',    salary:40000,  joining:'2023-09-01', pan:'ABCPK8765L', pfUAN:'100890123456', status:'resigned' },
]
export function getStaff() { return Promise.resolve([...STAFF]) }

export const ATTENDANCE = [
  { id:'ATT001', empId:'EMP001', empName:'Priya Sharma',   month:'Jan 2026', workingDays:22, present:22, absent:0, halfDay:0, leaves:0, lop:0  },
  { id:'ATT002', empId:'EMP002', empName:'Rahul Mehta',    month:'Jan 2026', workingDays:22, present:20, absent:1, halfDay:1, leaves:0, lop:1  },
  { id:'ATT003', empId:'EMP003', empName:'Ankit Rajput',   month:'Jan 2026', workingDays:22, present:21, absent:0, halfDay:0, leaves:1, lop:0  },
  { id:'ATT004', empId:'EMP004', empName:'Sneha Kulkarni', month:'Jan 2026', workingDays:22, present:18, absent:0, halfDay:0, leaves:4, lop:0  },
  { id:'ATT005', empId:'EMP005', empName:'Vikram Joshi',   month:'Jan 2026', workingDays:22, present:22, absent:0, halfDay:0, leaves:0, lop:0  },
]
export function getAttendance(month) { return Promise.resolve([...ATTENDANCE]) }

export const PAYROLL_RUNS = [
  { id:'PR001', month:'Dec 2025', employees:7, gross:535000, pf:64200,  esic:0,    tds:28000, netPay:442800, status:'paid',      paidOn:'2025-12-31' },
  { id:'PR002', month:'Nov 2025', employees:7, gross:535000, pf:64200,  esic:0,    tds:28000, netPay:442800, status:'paid',      paidOn:'2025-11-30' },
  { id:'PR003', month:'Oct 2025', employees:8, gross:575000, pf:69000,  esic:0,    tds:30000, netPay:476000, status:'paid',      paidOn:'2025-10-31' },
  { id:'PR004', month:'Jan 2026', employees:7, gross:535000, pf:64200,  esic:0,    tds:28000, netPay:442800, status:'pending',   paidOn:null         },
]
export function getPayrollRuns() { return Promise.resolve([...PAYROLL_RUNS]) }

export const SYSTEM_USERS = [
  { id:'USR001', name:'Priya Sharma',   email:'priya@unifiedtree.in',  role:'Super Admin',       lastLogin:'2026-01-06 11:30', status:'active'  },
  { id:'USR002', name:'Rahul Mehta',    email:'rahul@unifiedtree.in',  role:'Finance Lead',       lastLogin:'2026-01-06 10:15', status:'active'  },
  { id:'USR003', name:'Ankit Rajput',   email:'ankit@unifiedtree.in',  role:'Senior Accountant',  lastLogin:'2026-01-06 09:45', status:'active'  },
  { id:'USR004', name:'Sneha Kulkarni', email:'sneha@unifiedtree.in',  role:'Accountant',         lastLogin:'2026-01-05 17:30', status:'active'  },
  { id:'USR005', name:'CA Suresh Kumar',email:'ca.suresh@mehta.co.in', role:'CA / Auditor',       lastLogin:'2026-01-04 14:00', status:'temp'    },
  { id:'USR006', name:'Vikram Joshi',   email:'vikram@unifiedtree.in', role:'Viewer (Branch)',    lastLogin:'2026-01-03 11:00', status:'active'  },
]
export function getSystemUsers() { return Promise.resolve([...SYSTEM_USERS]) }

export const ONLINE_ORDERS = [
  { id:'OO001', ref:'ORD-2026-0088', date:'2026-01-06', customer:'Rajesh Electronics', items:3, amount:45000, platform:'Website',  status:'confirmed',  payment:'Online' },
  { id:'OO002', ref:'ORD-2026-0085', date:'2026-01-05', customer:'Gupta Electricals',  items:5, amount:82000, platform:'Website',  status:'dispatched', payment:'Online' },
  { id:'OO003', ref:'ORD-2026-0082', date:'2026-01-04', customer:'Walk-in',            items:1, amount:8500,  platform:'WhatsApp', status:'delivered',  payment:'UPI'    },
  { id:'OO004', ref:'ORD-2026-0079', date:'2026-01-03', customer:'Patel & Sons',       items:8, amount:138000,platform:'Website',  status:'delivered',  payment:'Online' },
  { id:'OO005', ref:'ORD-2026-0075', date:'2026-01-02', customer:'Walk-in',            items:2, amount:15000, platform:'WhatsApp', status:'cancelled',  payment:'COD'    },
]
export function getOnlineOrders() { return Promise.resolve([...ONLINE_ORDERS]) }

export const SMS_CAMPAIGNS = [
  { id:'SMS001', name:'Jan Payment Reminder',   type:'Reminder',  recipients:18, sent:18, delivered:17, failed:1, date:'2026-01-05', status:'sent'    },
  { id:'SMS002', name:'New Year Greetings',     type:'Marketing', recipients:85, sent:85, delivered:82, failed:3, date:'2026-01-01', status:'sent'    },
  { id:'SMS003', name:'Dec Outstanding Alert',  type:'Reminder',  recipients:12, sent:12, delivered:11, failed:1, date:'2025-12-28', status:'sent'    },
  { id:'SMS004', name:'Feb Payment Reminder',   type:'Reminder',  recipients:0,  sent:0,  delivered:0,  failed:0, date:'2026-02-05', status:'scheduled'},
]
export function getSMSCampaigns() { return Promise.resolve([...SMS_CAMPAIGNS]) }
