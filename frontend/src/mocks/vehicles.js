export const MOCK_VEHICLES = [
  {
    registration_number: "KA01AB1234",
    owner_name: "Rahul Sharma",
    owner_phone: "+91 98450 12345",
    owner_email: "rahul.sharma@example.com",
    vehicle_class: "Motor Car (LMV)",
    maker_model: "Tata Nexon Creative 1.2 Petrol",
    fuel_type: "Petrol",
    color: "White",
    registration_date: "2022-04-15",
    registered_rto: "KA-01 (Koramangala, Bengaluru)",
    documents: {
      rc: {
        status: "valid",
        rc_number: "RCKA01AB1234543",
        chassis_number: "MA3EFA123456789",
        engine_number: "ENG8945123",
        issue_date: "2022-04-15",
        expiry_date: "2037-04-14",
        days_left: 3816
      },
      insurance: {
        status: "valid",
        policy_number: "POL-78451209",
        insurer_name: "ICICI Lombard General Insurance",
        policy_type: "Comprehensive Package",
        issue_date: "2026-05-10",
        expiry_date: "2027-05-09",
        days_left: 188
      },
      puc: {
        status: "valid",
        certificate_number: "PUC/2026/894120",
        emission_norm: "BS-VI",
        tested_value: "CO: 0.12%, HC: 42 ppm",
        issue_date: "2026-08-01",
        expiry_date: "2027-02-01",
        days_left: 91
      },
      road_tax: {
        status: "paid",
        tax_type: "One-Time Life Time Tax (LTT)",
        amount_paid: 18500,
        payment_date: "2022-04-15",
        valid_until: "2037-04-14",
        days_left: 3816
      }
    },
    previous_challans: []
  },
  {
    registration_number: "KA03MG4567",
    owner_name: "Pooja Hegde",
    owner_phone: "+91 99801 88776",
    owner_email: "pooja.h@example.com",
    vehicle_class: "Motor Car (LMV)",
    maker_model: "Hyundai Creta SX 1.5",
    fuel_type: "Diesel",
    color: "Metallic Grey",
    registration_date: "2023-01-10",
    registered_rto: "KA-03 (Indiranagar, Bengaluru)",
    documents: {
      rc: {
        status: "valid",
        rc_number: "RCKA03MG4567112",
        chassis_number: "MA3CRE998877665",
        engine_number: "ENG4433221",
        issue_date: "2023-01-10",
        expiry_date: "2038-01-09",
        days_left: 4085
      },
      insurance: {
        status: "valid",
        policy_number: "POL-44129088",
        insurer_name: "HDFC ERGO General Insurance",
        policy_type: "Comprehensive Package",
        issue_date: "2026-03-20",
        expiry_date: "2027-03-19",
        days_left: 137
      },
      puc: {
        status: "expiring_soon",
        certificate_number: "PUC/2026/332144",
        emission_norm: "BS-VI",
        tested_value: "CO: 0.18%, HC: 50 ppm",
        issue_date: "2026-05-15",
        expiry_date: "2026-11-14",
        days_left: 12
      },
      road_tax: {
        status: "paid",
        tax_type: "One-Time Life Time Tax (LTT)",
        amount_paid: 22000,
        payment_date: "2023-01-10",
        valid_until: "2038-01-09",
        days_left: 4085
      }
    },
    previous_challans: []
  },
  {
    registration_number: "MH12DE7890",
    owner_name: "Amit Deshmukh",
    owner_phone: "+91 97654 32109",
    owner_email: "amit.desh@example.com",
    vehicle_class: "Motor Car (LMV)",
    maker_model: "Maruti Suzuki Swift ZXi",
    fuel_type: "Petrol",
    color: "Cherry Red",
    registration_date: "2021-09-18",
    registered_rto: "MH-12 (Pune Central)",
    documents: {
      rc: {
        status: "valid",
        rc_number: "RCMH12DE7890887",
        chassis_number: "MA3SWF887766554",
        engine_number: "ENG1289456",
        issue_date: "2021-09-18",
        expiry_date: "2036-09-17",
        days_left: 3606
      },
      insurance: {
        status: "expiring_soon",
        policy_number: "POL-99120485",
        insurer_name: "Bajaj Allianz General Insurance",
        policy_type: "Comprehensive Package",
        issue_date: "2025-11-23",
        expiry_date: "2026-11-22",
        days_left: 20
      },
      puc: {
        status: "valid",
        certificate_number: "PUC/2026/554411",
        emission_norm: "BS-VI",
        tested_value: "CO: 0.09%, HC: 38 ppm",
        issue_date: "2026-09-01",
        expiry_date: "2027-03-01",
        days_left: 119
      },
      road_tax: {
        status: "paid",
        tax_type: "Life Time Tax (LTT)",
        amount_paid: 16000,
        payment_date: "2021-09-18",
        valid_until: "2036-09-17",
        days_left: 3606
      }
    },
    previous_challans: []
  },
  {
    registration_number: "DL04CC9999",
    owner_name: "Vikram Malhotra",
    owner_phone: "+91 98110 54321",
    owner_email: "vikram.m@example.com",
    vehicle_class: "Motor Car (LMV)",
    maker_model: "Mahindra XUV700 AX7",
    fuel_type: "Diesel",
    color: "Black",
    registration_date: "2022-11-05",
    registered_rto: "DL-04 (Janakpuri, West Delhi)",
    documents: {
      rc: {
        status: "valid",
        rc_number: "RCDL04CC9999001",
        chassis_number: "MA3XUV009988771",
        engine_number: "ENG8899001",
        issue_date: "2022-11-05",
        expiry_date: "2037-11-04",
        days_left: 4019
      },
      insurance: {
        status: "expired",
        policy_number: "POL-11029384",
        insurer_name: "Tata AIG General Insurance",
        policy_type: "Comprehensive Package",
        issue_date: "2025-08-15",
        expiry_date: "2026-08-14",
        days_left: -80
      },
      puc: {
        status: "valid",
        certificate_number: "PUC/2026/112233",
        emission_norm: "BS-VI",
        tested_value: "CO: 0.14%, HC: 46 ppm",
        issue_date: "2026-07-10",
        expiry_date: "2027-01-10",
        days_left: 69
      },
      road_tax: {
        status: "paid",
        tax_type: "Life Time Tax (LTT)",
        amount_paid: 28000,
        payment_date: "2022-11-05",
        valid_until: "2037-11-04",
        days_left: 4019
      }
    },
    previous_challans: [
      {
        id: "CH-202609-DL04-8921",
        violation_code: "VIO-OVERSPEED",
        violation_title: "Over-speeding on Ring Road",
        rule_section: "Sec 112/183 MV Act",
        fine_amount: 1500,
        issued_at: "2026-09-14",
        payment_status: "paid"
      }
    ]
  },
  {
    registration_number: "KA05NB3321",
    owner_name: "Kiran Gowda",
    owner_phone: "+91 94480 33221",
    owner_email: "kiran.gowda@example.com",
    vehicle_class: "Motorcycle (2-Wheeler)",
    maker_model: "Royal Enfield Classic 350",
    fuel_type: "Petrol",
    color: "Silver",
    registration_date: "2023-06-12",
    registered_rto: "KA-05 (Jayanagar, Bengaluru)",
    documents: {
      rc: {
        status: "valid",
        rc_number: "RCKA05NB3321445",
        chassis_number: "MA3REC994411223",
        engine_number: "ENG3322114",
        issue_date: "2023-06-12",
        expiry_date: "2038-06-11",
        days_left: 4238
      },
      insurance: {
        status: "valid",
        policy_number: "POL-33219084",
        insurer_name: "Digit General Insurance",
        policy_type: "Two-Wheeler Comprehensive",
        issue_date: "2026-06-01",
        expiry_date: "2027-05-31",
        days_left: 210
      },
      puc: {
        status: "expired",
        certificate_number: "PUC/2026/902144",
        emission_norm: "BS-VI",
        tested_value: "CO: 0.29%, HC: 72 ppm",
        issue_date: "2026-02-10",
        expiry_date: "2026-08-10",
        days_left: -84
      },
      road_tax: {
        status: "paid",
        tax_type: "Life Time Tax (LTT)",
        amount_paid: 4500,
        payment_date: "2023-06-12",
        valid_until: "2038-06-11",
        days_left: 4238
      }
    },
    previous_challans: [
      {
        id: "CH-202610-KA05-1049",
        violation_code: "VIO-NO-HELMET",
        violation_title: "Riding Without Helmet",
        rule_section: "Sec 194D MV Act",
        fine_amount: 1000,
        issued_at: "2026-10-12",
        payment_status: "unpaid"
      }
    ]
  },
  {
    registration_number: "KA04EF1122",
    owner_name: "Manjunath Swamy",
    owner_phone: "+91 94490 88771",
    owner_email: "manju.s@example.com",
    vehicle_class: "Motor Car (LMV)",
    maker_model: "Tata Punch Adventure",
    fuel_type: "Petrol",
    color: "Golden Bronze",
    registration_date: "2022-03-10",
    registered_rto: "KA-04 (Yeshwanthpur, Bengaluru)",
    documents: {
      rc: {
        status: "valid",
        rc_number: "RCKA04EF1122990",
        chassis_number: "MA3PUN889900112",
        engine_number: "ENG9001122",
        issue_date: "2022-03-10",
        expiry_date: "2037-03-09",
        days_left: 3779
      },
      insurance: {
        status: "valid",
        policy_number: "POL-88991122",
        insurer_name: "New India Assurance Co.",
        policy_type: "Comprehensive",
        issue_date: "2026-04-01",
        expiry_date: "2027-03-31",
        days_left: 149
      },
      puc: {
        status: "valid",
        certificate_number: "PUC/2026/445566",
        emission_norm: "BS-VI",
        tested_value: "CO: 0.11%, HC: 40 ppm",
        issue_date: "2026-08-15",
        expiry_date: "2027-02-15",
        days_left: 105
      },
      road_tax: {
        status: "pending",
        tax_type: "Annual Commercial / Road Tax",
        amount_paid: 0,
        payment_date: "2025-03-10",
        valid_until: "2026-03-09",
        days_left: -238
      }
    },
    previous_challans: []
  },
  {
    registration_number: "22BH9988AA",
    owner_name: "Col. Sanjeev Kapoor",
    owner_phone: "+91 98200 44556",
    owner_email: "sanjeev.kapoor@example.com",
    vehicle_class: "Motor Car (LMV)",
    maker_model: "Toyota Innova Hycross",
    fuel_type: "Hybrid",
    color: "Silver",
    registration_date: "2022-10-25",
    registered_rto: "BH (Central Ministry Transport Series)",
    documents: {
      rc: {
        status: "valid",
        rc_number: "RC22BH9988AA100",
        chassis_number: "MA3TOY887766112",
        engine_number: "ENG7766112",
        issue_date: "2022-10-25",
        expiry_date: "2037-10-24",
        days_left: 4008
      },
      insurance: {
        status: "valid",
        policy_number: "POL-77112233",
        insurer_name: "United India Insurance",
        policy_type: "Comprehensive",
        issue_date: "2026-09-10",
        expiry_date: "2027-09-09",
        days_left: 311
      },
      puc: {
        status: "valid",
        certificate_number: "PUC/2026/889900",
        emission_norm: "BS-VI Hybrid",
        tested_value: "CO: 0.04%, HC: 18 ppm",
        issue_date: "2026-10-01",
        expiry_date: "2027-04-01",
        days_left: 150
      },
      road_tax: {
        status: "paid",
        tax_type: "BH-Series Biennial Tax",
        amount_paid: 24000,
        payment_date: "2024-10-25",
        valid_until: "2026-10-24",
        days_left: 356
      }
    },
    previous_challans: []
  },
  {
    registration_number: "DL01A1001",
    owner_name: "Sunita Verma",
    owner_phone: "+91 98100 22334",
    owner_email: "sunita.v@example.com",
    vehicle_class: "Motorcycle (2-Wheeler)",
    maker_model: "Honda Activa 6G DLX",
    fuel_type: "Petrol",
    color: "White",
    registration_date: "2021-05-14",
    registered_rto: "DL-01 (Mall Road, North Delhi)",
    documents: {
      rc: {
        status: "valid",
        rc_number: "RCDL01A1001234",
        chassis_number: "MA3HON112233445",
        engine_number: "ENG1122334",
        issue_date: "2021-05-14",
        expiry_date: "2036-05-13",
        days_left: 3479
      },
      insurance: {
        status: "valid",
        policy_number: "POL-55443322",
        insurer_name: "ICICI Lombard",
        policy_type: "Comprehensive",
        issue_date: "2026-05-01",
        expiry_date: "2027-04-30",
        days_left: 179
      },
      puc: {
        status: "valid",
        certificate_number: "PUC/2026/334455",
        emission_norm: "BS-VI",
        tested_value: "CO: 0.10%, HC: 35 ppm",
        issue_date: "2026-08-01",
        expiry_date: "2027-02-01",
        days_left: 91
      },
      road_tax: {
        status: "paid",
        tax_type: "Life Time Tax (LTT)",
        amount_paid: 3200,
        payment_date: "2021-05-14",
        valid_until: "2036-05-13",
        days_left: 3479
      }
    },
    previous_challans: []
  },
  {
    registration_number: "KA53Z9000",
    owner_name: "Deepak Choudhury",
    owner_phone: "+91 99001 77889",
    owner_email: "deepak.c@example.com",
    vehicle_class: "Motorcycle (2-Wheeler)",
    maker_model: "Ather 450X Gen 3",
    fuel_type: "EV",
    color: "White",
    registration_date: "2023-08-20",
    registered_rto: "KA-53 (KR Puram, Bengaluru)",
    documents: {
      rc: {
        status: "valid",
        rc_number: "RCKA53Z9000881",
        chassis_number: "MA3ATH990011223",
        engine_number: "MOT9900112",
        issue_date: "2023-08-20",
        expiry_date: "2038-08-19",
        days_left: 4307
      },
      insurance: {
        status: "expired",
        policy_number: "POL-99001122",
        insurer_name: "Bajaj Allianz",
        policy_type: "Third-Party",
        issue_date: "2024-08-20",
        expiry_date: "2025-08-19",
        days_left: -440
      },
      puc: {
        status: "valid",
        certificate_number: "PUC/EXEMPT/EV",
        emission_norm: "Zero Emission (EV Exempt)",
        tested_value: "N/A (Battery Electric Vehicle)",
        issue_date: "2023-08-20",
        expiry_date: "2038-08-19",
        days_left: 4307
      },
      road_tax: {
        status: "paid",
        tax_type: "EV Road Tax Exemption",
        amount_paid: 0,
        payment_date: "2023-08-20",
        valid_until: "2038-08-19",
        days_left: 4307
      }
    },
    previous_challans: [
      {
        id: "CH-202610-KA53-4412",
        violation_code: "VIO-SIGNAL-JUMP",
        violation_title: "Jumping Red Signal at Tin Factory Junction",
        rule_section: "Sec 119/177 MV Act",
        fine_amount: 1000,
        issued_at: "2026-10-20",
        payment_status: "unpaid"
      },
      {
        id: "CH-202609-KA53-1102",
        violation_code: "VIO-NO-HELMET",
        violation_title: "Riding Without Helmet",
        rule_section: "Sec 194D MV Act",
        fine_amount: 1000,
        issued_at: "2026-09-18",
        payment_status: "unpaid"
      },
      {
        id: "CH-202608-KA53-9090",
        violation_code: "VIO-PHONE-DRIVE",
        violation_title: "Using Mobile Phone while riding",
        rule_section: "Sec 184(c) MV Act",
        fine_amount: 1500,
        issued_at: "2026-08-05",
        payment_status: "unpaid"
      }
    ]
  },
  {
    registration_number: "MH02CB5555",
    owner_name: "Metro Transport Logistics",
    owner_phone: "+91 98210 99887",
    owner_email: "fleet@metrotransport.com",
    vehicle_class: "Commercial Goods (HGV)",
    maker_model: "Tata 407 Gold SFC",
    fuel_type: "Diesel",
    color: "Navy Blue",
    registration_date: "2018-02-15",
    registered_rto: "MH-02 (Mumbai West)",
    documents: {
      rc: {
        status: "expired",
        rc_number: "RCMH02CB5555110",
        chassis_number: "MA3TAT407112233",
        engine_number: "ENG4071122",
        issue_date: "2018-02-15",
        expiry_date: "2026-02-14",
        days_left: -261
      },
      insurance: {
        status: "expired",
        policy_number: "POL-40711223",
        insurer_name: "Tata AIG",
        policy_type: "Commercial Goods Vehicle",
        issue_date: "2025-01-10",
        expiry_date: "2026-01-09",
        days_left: -297
      },
      puc: {
        status: "expired",
        certificate_number: "PUC/2025/407999",
        emission_norm: "BS-IV",
        tested_value: "CO: 0.65%, HC: 140 ppm",
        issue_date: "2025-08-10",
        expiry_date: "2026-02-10",
        days_left: -265
      },
      road_tax: {
        status: "pending",
        tax_type: "Annual Commercial Goods Tax",
        amount_paid: 0,
        payment_date: "2025-02-15",
        valid_until: "2026-02-14",
        days_left: -261
      }
    },
    previous_challans: [
      {
        id: "CH-202604-MH02-9901",
        violation_code: "VIO-RC-EXP",
        violation_title: "Operating commercial vehicle without fitness/RC",
        rule_section: "Sec 192 MV Act",
        fine_amount: 5000,
        issued_at: "2026-04-12",
        payment_status: "unpaid"
      }
    ]
  }
];
