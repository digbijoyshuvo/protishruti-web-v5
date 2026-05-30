export type DemoInvestor = {
  id: string;
  display_name: string;
  sectors: string[];
  preferred_location: string;
  ticket_size_min: number;
  ticket_size_max: number;
  risk_tolerance: "low" | "medium" | "high";
  contact_email: string;
  notes: string;
  is_demo?: boolean;
};

export const DEMO_INVESTORS: DemoInvestor[] = [
  {
    id: "demo-1",
    display_name: "BRAC Microventures",
    sectors: ["kirana", "vegetable"],
    preferred_location: "Dhaka",
    ticket_size_min: 100000,
    ticket_size_max: 1000000,
    risk_tolerance: "medium",
    contact_email: "invest@bracmv.example.com",
    notes: "Focuses on urban retail micro-businesses across Bangladesh.",
    is_demo: true,
  },
  {
    id: "demo-2",
    display_name: "Padma Capital",
    sectors: ["restaurant", "manufacturing", "service"],
    preferred_location: "Khulna",
    ticket_size_min: 500000,
    ticket_size_max: 5000000,
    risk_tolerance: "high",
    contact_email: "deals@padmacap.example.com",
    notes: "Growth equity for established SMEs with ৳1L+ monthly revenue.",
    is_demo: true,
  },
  {
    id: "demo-3",
    display_name: "Green Roots Fund",
    sectors: ["vegetable", "manufacturing"],
    preferred_location: "Rajshahi",
    ticket_size_min: 50000,
    ticket_size_max: 500000,
    risk_tolerance: "low",
    contact_email: "hello@greenroots.example.com",
    notes: "Agri value-chain investor, prefers verified shops.",
    is_demo: true,
  },
  {
    id: "demo-4",
    display_name: "Bengal Angel Network",
    sectors: ["electronics", "mobile"],
    preferred_location: "Chittagong",
    ticket_size_min: 200000,
    ticket_size_max: 2000000,
    risk_tolerance: "medium",
    contact_email: "angels@bengalnet.example.com",
    notes: "Angel cheques for tech-enabled SMEs.",
    is_demo: true,
  },
  {
    id: "demo-5",
    display_name: "Sonali SME Partners",
    sectors: ["pharmacy", "hardware", "cosmetics"],
    preferred_location: "Dhaka",
    ticket_size_min: 150000,
    ticket_size_max: 1500000,
    risk_tolerance: "medium",
    contact_email: "partners@sonalisme.example.com",
    notes: "Long-term partner for licensed SMEs with strong cash flow.",
    is_demo: true,
  },
];
