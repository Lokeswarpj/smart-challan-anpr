export const MOCK_CHALLANS = [
  {
    id: "CH-202611-KA05-1049",
    registration_number: "KA05NB3321",
    owner_name: "Kiran Gowda",
    violation_code: "VIO-NO-HELMET",
    violation_title: "Riding Two-Wheeler Without Protective Headgear (Helmet)",
    rule_section: "Section 194D Motor Vehicles Act",
    fine_amount: 1000,
    location: "Jayanagar 4th Block Signal, Bengaluru",
    issued_at: "2026-10-12 11:30 AM",
    due_date: "2026-11-11",
    payment_status: "unpaid",
    dispatch_status: "sent_both",
    officer_name: "Sub-Inspector Ramesh Kumar",
    officer_badge: "KA-POL-1001"
  },
  {
    id: "CH-202610-KA53-4412",
    registration_number: "KA53Z9000",
    owner_name: "Deepak Choudhury",
    violation_code: "VIO-SIGNAL-JUMP",
    violation_title: "Violation of Mandatory Traffic Signals (Signal Jumping)",
    rule_section: "Section 119/177 Motor Vehicles Act",
    fine_amount: 1000,
    location: "Tin Factory Junction, KR Puram, Bengaluru",
    issued_at: "2026-10-20 04:15 PM",
    due_date: "2026-11-19",
    payment_status: "unpaid",
    dispatch_status: "sent_sms",
    officer_name: "Head Constable Lokesh Gowda",
    officer_badge: "KA-POL-1002"
  },
  {
    id: "CH-202609-DL04-8921",
    registration_number: "DL04CC9999",
    owner_name: "Vikram Malhotra",
    violation_code: "VIO-OVERSPEED",
    violation_title: "Exceeding Prescribed Speed Limit (Over-speeding)",
    rule_section: "Section 112/183 Motor Vehicles Act",
    fine_amount: 1500,
    location: "Outer Ring Road, West Delhi",
    issued_at: "2026-09-14 02:45 PM",
    due_date: "2026-10-14",
    payment_status: "paid",
    dispatch_status: "sent_both",
    officer_name: "Sub-Inspector Ramesh Kumar",
    officer_badge: "KA-POL-1001"
  },
  {
    id: "CH-202604-MH02-9901",
    registration_number: "MH02CB5555",
    owner_name: "Metro Transport Logistics",
    violation_code: "VIO-RC-EXP",
    violation_title: "Operating Vehicle Without Valid Registration (Expired Fitness)",
    rule_section: "Section 192 Motor Vehicles Act",
    fine_amount: 5000,
    location: "Western Express Highway Checkpoint, Mumbai",
    issued_at: "2026-04-12 09:20 AM",
    due_date: "2026-05-12",
    payment_status: "unpaid",
    dispatch_status: "sent_email",
    officer_name: "Assistant Commissioner Anand Patil",
    officer_badge: "KA-POL-ADMIN"
  },
  {
    id: "CH-202611-KA01-3320",
    registration_number: "KA01AB1234",
    owner_name: "Rahul Sharma",
    violation_code: "VIO-NO-SEATBELT",
    violation_title: "Driving Without Fastened Safety Seatbelt",
    rule_section: "Section 194B Motor Vehicles Act",
    fine_amount: 1000,
    location: "Koramangala 80ft Road, Bengaluru",
    issued_at: "2026-07-08 05:10 PM",
    due_date: "2026-08-07",
    payment_status: "paid",
    dispatch_status: "sent_both",
    officer_name: "Sub-Inspector Ramesh Kumar",
    officer_badge: "KA-POL-1001"
  }
];

export const VIOLATION_TYPES = [
  {
    code: "VIO-PUC-EXP",
    title: "Expired Pollution Under Control (PUC) Certificate",
    section: "Section 190(2) MV Act",
    fine: 2000
  },
  {
    code: "VIO-INS-EXP",
    title: "Driving Uninsured Vehicle (No Valid Insurance)",
    section: "Section 196 MV Act",
    fine: 2000
  },
  {
    code: "VIO-RC-EXP",
    title: "Operating Vehicle Without Valid Registration (RC)",
    section: "Section 192 MV Act",
    fine: 5000
  },
  {
    code: "VIO-TAX-PENDING",
    title: "Failure to pay Motor Vehicle / Road Tax",
    section: "Section 177 / Motor Vehicle Taxation Act",
    fine: 3000
  },
  {
    code: "VIO-SIGNAL-JUMP",
    title: "Violation of Mandatory Traffic Signals (Signal Jumping)",
    section: "Section 119/177 MV Act",
    fine: 1000
  },
  {
    code: "VIO-NO-HELMET",
    title: "Riding Two-Wheeler Without Protective Headgear",
    section: "Section 194D MV Act",
    fine: 1000
  },
  {
    code: "VIO-NO-SEATBELT",
    title: "Driving Without Fastened Safety Seatbelt",
    section: "Section 194B MV Act",
    fine: 1000
  },
  {
    code: "VIO-OVERSPEED",
    title: "Exceeding Prescribed Speed Limit (Over-speeding)",
    section: "Section 112/183 MV Act",
    fine: 1500
  },
  {
    code: "VIO-PHONE-DRIVE",
    title: "Use of Handheld Mobile Phone While Driving",
    section: "Section 184(c) MV Act",
    fine: 1500
  }
];

