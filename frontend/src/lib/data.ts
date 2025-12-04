export type BrandOption = { value: string; label: string };
export type Vehicle = {
  plate: string;
  brand: string;
  model: string;
  year: number;
  customer: string;
  fileNumber: string;
  damageDate: string;
  status: string;
};
export type Customer = {
  name: string;
  phone: string;
  email?: string;
  vehicles: Array<{ plate: string; model: string; fileNumber: string; date: string }>;
};

export const defaultBrands: BrandOption[] = [
  { value: 'toyota', label: 'Toyota' },
  { value: 'bmw', label: 'BMW' },
  { value: 'mercedes', label: 'Mercedes' },
  { value: 'audi', label: 'Audi' }
];

export const sampleVehicles: Vehicle[] = [
  {
    plate: '34ABC123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2021,
    customer: 'Mehmet Yılmaz',
    fileNumber: 'FN-2024-001',
    damageDate: '2024-04-02',
    status: 'In Progress'
  },
  {
    plate: '06XYZ789',
    brand: 'BMW',
    model: '320i',
    year: 2020,
    customer: 'Ayşe Demir',
    fileNumber: 'FN-2024-002',
    damageDate: '2024-05-12',
    status: 'Waiting Parts'
  },
  {
    plate: '35KLM456',
    brand: 'Mercedes',
    model: 'C200',
    year: 2019,
    customer: 'Mehmet Yılmaz',
    fileNumber: 'FN-2023-115',
    damageDate: '2023-11-28',
    status: 'Completed'
  }
];

export const sampleCustomers: Customer[] = [
  {
    name: 'Mehmet Yılmaz',
    phone: '+90 532 000 0000',
    email: 'mehmet@example.com',
    vehicles: [
      { plate: '34ABC123', model: 'Toyota Corolla', fileNumber: 'FN-2024-001', date: '2024-04-02' },
      { plate: '35KLM456', model: 'Mercedes C200', fileNumber: 'FN-2023-115', date: '2023-11-28' }
    ]
  },
  {
    name: 'Ayşe Demir',
    phone: '+90 533 111 1111',
    email: 'ayse@example.com',
    vehicles: [
      { plate: '06XYZ789', model: 'BMW 320i', fileNumber: 'FN-2024-002', date: '2024-05-12' }
    ]
  }
];
