export const MOCK_DASHBOARD = {
  metrics: {
    total_checked: 310,
    valid_vehicles: 218,
    expired_documents: 64,
    amber_warnings: 28,
    challans_issued: 208,
    unpaid_challans: 68,
    collection_amount: 384500
  },
  activity_chart: [
    { time: "08:00", checks: 14, violations: 3 },
    { time: "10:00", checks: 38, violations: 9 },
    { time: "12:00", checks: 52, violations: 12 },
    { time: "14:00", checks: 45, violations: 7 },
    { time: "16:00", checks: 68, violations: 16 },
    { time: "18:00", checks: 74, violations: 21 },
    { time: "20:00", checks: 32, violations: 8 }
  ],
  document_breakdown: [
    { name: "RC Valid", count: 295, color: "#22C55E" },
    { name: "Insurance Valid", count: 248, color: "#22C55E" },
    { name: "PUC Valid", count: 252, color: "#22C55E" },
    { name: "Road Tax Paid", count: 288, color: "#22C55E" },
    { name: "Expired / Pending", count: 77, color: "#EF4444" }
  ],
  recent_activity_log: [
    {
      id: 1,
      officer: "KA-POL-1001",
      action: "Camera ANPR Scan",
      plate: "KA05NB3321",
      result: "Expired PUC Detected",
      timestamp: "10 mins ago"
    },
    {
      id: 2,
      officer: "KA-POL-1002",
      action: "Manual Verification",
      plate: "KA01AB1234",
      result: "100% Compliant (All Valid)",
      timestamp: "22 mins ago"
    },
    {
      id: 3,
      officer: "KA-POL-1001",
      action: "Digital Challan Issued",
      plate: "KA53Z9000",
      result: "Fine: ₹1,000 (Signal Jump)",
      timestamp: "45 mins ago"
    },
    {
      id: 4,
      officer: "KA-POL-ADMIN",
      action: "Report Export",
      plate: "ALL",
      result: "Daily Enforcement PDF Generated",
      timestamp: "1 hour ago"
    }
  ]
};
