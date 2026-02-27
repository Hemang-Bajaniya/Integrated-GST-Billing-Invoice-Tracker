// Mock data for static frontend demo

export const mockUser = {
  id: '1',
  email: 'demo@example.com',
  full_name: 'Demo User',
  role: 'admin',
  business_id: '1'
};

export const mockProfile = {
  id: '1',
  email: 'demo@example.com',
  full_name: 'Demo User',
  role: 'admin' as const,
  business_id: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockCustomers = [
  {
    id: '1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+91 98765 43210',
    address: '123 Business Park, Mumbai',
    gstin: '27AABCU9603R1ZM',
    business_id: '1',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'TechStart Solutions',
    email: 'info@techstart.com',
    phone: '+91 98765 43211',
    address: '456 Tech Hub, Bangalore',
    gstin: '29AABCU9603R1ZN',
    business_id: '1',
    created_at: '2024-01-20T10:00:00Z'
  },
  {
    id: '3',
    name: 'Global Traders Ltd',
    email: 'sales@globaltraders.com',
    phone: '+91 98765 43212',
    address: '789 Market St, Delhi',
    gstin: '07AABCU9603R1ZO',
    business_id: '1',
    created_at: '2024-02-01T10:00:00Z'
  }
];

export const mockVendors = [
  {
    id: '1',
    name: 'Office Supplies Co',
    email: 'orders@officesupplies.com',
    phone: '+91 98765 54321',
    address: '321 Supply Lane, Pune',
    gstin: '27AABCU9603R1ZP',
    business_id: '1',
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    name: 'Tech Equipment Inc',
    email: 'sales@techequip.com',
    phone: '+91 98765 54322',
    address: '654 Hardware St, Chennai',
    gstin: '33AABCU9603R1ZQ',
    business_id: '1',
    created_at: '2024-01-25T10:00:00Z'
  }
];

export const mockProducts = [
  {
    id: '1',
    name: 'Web Development Service',
    description: 'Custom website development',
    hsn_code: '998314',
    unit: 'Service',
    rate: 50000,
    tax_rate: 18,
    business_id: '1',
    created_at: '2024-01-05T10:00:00Z'
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'iOS and Android app development',
    hsn_code: '998315',
    unit: 'Service',
    rate: 75000,
    tax_rate: 18,
    business_id: '1',
    created_at: '2024-01-05T10:00:00Z'
  },
  {
    id: '3',
    name: 'UI/UX Design',
    description: 'User interface and experience design',
    hsn_code: '998316',
    unit: 'Service',
    rate: 30000,
    tax_rate: 18,
    business_id: '1',
    created_at: '2024-01-05T10:00:00Z'
  },
  {
    id: '4',
    name: 'Consulting Services',
    description: 'Technical consulting and advisory',
    hsn_code: '998317',
    unit: 'Hour',
    rate: 5000,
    tax_rate: 18,
    business_id: '1',
    created_at: '2024-01-05T10:00:00Z'
  }
];

export const mockInvoices = [
  {
    id: '1',
    invoice_number: 'INV-2024-001',
    customer_id: '1',
    customer: mockCustomers[0],
    issue_date: '2024-02-01',
    due_date: '2024-02-15',
    status: 'paid',
    subtotal: 50000,
    tax_amount: 9000,
    total_amount: 59000,
    amount_paid: 59000,
    notes: 'Thank you for your business',
    business_id: '1',
    created_at: '2024-02-01T10:00:00Z',
    items: [
      {
        id: '1',
        product_id: '1',
        product: mockProducts[0],
        description: 'Web Development Service',
        quantity: 1,
        rate: 50000,
        tax_rate: 18,
        amount: 50000
      }
    ]
  },
  {
    id: '2',
    invoice_number: 'INV-2024-002',
    customer_id: '2',
    customer: mockCustomers[1],
    issue_date: '2024-02-03',
    due_date: '2024-02-17',
    status: 'pending',
    subtotal: 75000,
    tax_amount: 13500,
    total_amount: 88500,
    amount_paid: 0,
    notes: '',
    business_id: '1',
    created_at: '2024-02-03T10:00:00Z',
    items: [
      {
        id: '2',
        product_id: '2',
        product: mockProducts[1],
        description: 'Mobile App Development',
        quantity: 1,
        rate: 75000,
        tax_rate: 18,
        amount: 75000
      }
    ]
  },
  {
    id: '3',
    invoice_number: 'INV-2024-003',
    customer_id: '3',
    customer: mockCustomers[2],
    issue_date: '2024-01-20',
    due_date: '2024-02-03',
    status: 'overdue',
    subtotal: 30000,
    tax_amount: 5400,
    total_amount: 35400,
    amount_paid: 0,
    notes: '',
    business_id: '1',
    created_at: '2024-01-20T10:00:00Z',
    items: [
      {
        id: '3',
        product_id: '3',
        product: mockProducts[2],
        description: 'UI/UX Design',
        quantity: 1,
        rate: 30000,
        tax_rate: 18,
        amount: 30000
      }
    ]
  },
  {
    id: '4',
    invoice_number: 'INV-2024-004',
    customer_id: '1',
    customer: mockCustomers[0],
    issue_date: '2024-02-05',
    due_date: '2024-02-19',
    status: 'draft',
    subtotal: 40000,
    tax_amount: 7200,
    total_amount: 47200,
    amount_paid: 0,
    notes: '',
    business_id: '1',
    created_at: '2024-02-05T10:00:00Z',
    items: [
      {
        id: '4',
        product_id: '4',
        product: mockProducts[3],
        description: 'Consulting Services',
        quantity: 8,
        rate: 5000,
        tax_rate: 18,
        amount: 40000
      }
    ]
  }
];

export const mockBusiness = {
  id: '1',
  name: 'Demo Business Pvt Ltd',
  email: 'contact@demobusiness.com',
  phone: '+91 98765 00000',
  address: '123 Business Street, Mumbai, Maharashtra 400001',
  gstin: '27AABCD1234E1ZF',
  pan: 'AABCD1234E',
  bank_name: 'HDFC Bank',
  account_number: '1234567890',
  ifsc_code: 'HDFC0001234',
  logo_url: null,
  created_at: '2024-01-01T10:00:00Z'
};
