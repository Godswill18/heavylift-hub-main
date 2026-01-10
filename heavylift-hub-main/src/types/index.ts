// MachRent Type Definitions

export type UserRole = 'admin' | 'contractor' | 'owner';

export type EquipmentCategory = 
  | 'excavator' 
  | 'backhoe' 
  | 'tipper' 
  | 'crane' 
  | 'bulldozer' 
  | 'loader' 
  | 'compactor' 
  | 'grader' 
  | 'forklift' 
  | 'generator' 
  | 'other';

export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'needs_repair';

export type BookingStatus = 
  | 'requested' 
  | 'accepted' 
  | 'rejected' 
  | 'pending_payment' 
  | 'confirmed' 
  | 'delivering' 
  | 'on_hire' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';

export type TransactionType = 'payment' | 'refund' | 'payout' | 'deposit' | 'fee';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  company_name: string | null;
  company_registration: string | null;
  address: string | null;
  city: string | null;
  bio: string | null;
  verification_status: VerificationStatus;
  is_company: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: EquipmentCategory;
  make: string;
  model: string;
  year: number | null;
  capacity: string | null;
  condition: EquipmentCondition;
  location: string;
  city: string;
  daily_rate: number;
  minimum_days: number;
  deposit_amount: number;
  delivery_available: boolean;
  delivery_radius: number | null;
  delivery_fee: number;
  specifications: Record<string, unknown>;
  maintenance_history: string | null;
  insurance_details: string | null;
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  total_reviews: number;
  total_bookings: number;
  images: string[];
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export interface Booking {
  id: string;
  booking_number: string;
  contractor_id: string | null;
  equipment_id: string | null;
  owner_id: string | null;
  start_date: string;
  end_date: string;
  site_location: string;
  site_address: string | null;
  usage_hours_per_day: number | null;
  special_requirements: string | null;
  status: BookingStatus;
  rental_amount: number;
  platform_fee: number;
  vat_amount: number;
  deposit_amount: number;
  total_amount: number;
  owner_payout: number | null;
  payment_status: string;
  escrow_status: string;
  delivery_photos: string[];
  return_photos: string[];
  owner_notes: string | null;
  contractor_notes: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  equipment?: Equipment;
  contractor?: Profile;
  owner?: Profile;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  equipment_id: string | null;
  rating: number;
  comment: string | null;
  helpful_count: number;
  created_at: string;
  reviewer?: Profile;
}

export interface Dispute {
  id: string;
  booking_id: string;
  raised_by: string;
  raised_by_role: string;
  reason: string;
  description: string | null;
  evidence: string[];
  status: DisputeStatus;
  resolution: string | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
  booking?: Booking;
}

export interface Transaction {
  id: string;
  user_id: string;
  booking_id: string | null;
  type: TransactionType;
  amount: number;
  fee: number;
  net_amount: number | null;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  description: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface EquipmentFilters {
  category?: EquipmentCategory;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  available?: boolean;
  search?: string;
}

// Lagos locations for filtering
export const LAGOS_LOCATIONS = [
  'Lekki',
  'Victoria Island',
  'Ikeja',
  'Ajah',
  'Ikoyi',
  'Surulere',
  'Yaba',
  'Festac',
  'Apapa',
  'Marina',
  'Oshodi',
  'Gbagada',
  'Maryland',
  'Magodo',
  'Ogudu',
] as const;

export const EQUIPMENT_CATEGORIES: { value: EquipmentCategory; label: string }[] = [
  { value: 'excavator', label: 'Excavator' },
  { value: 'backhoe', label: 'Backhoe' },
  { value: 'tipper', label: 'Tipper' },
  { value: 'crane', label: 'Crane' },
  { value: 'bulldozer', label: 'Bulldozer' },
  { value: 'loader', label: 'Loader' },
  { value: 'compactor', label: 'Compactor' },
  { value: 'grader', label: 'Grader' },
  { value: 'forklift', label: 'Forklift' },
  { value: 'generator', label: 'Generator' },
  { value: 'other', label: 'Other' },
];

// Helper to format Nigerian Naira
export const formatNaira = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
};

// Calculate booking costs
export const calculateBookingCosts = (dailyRate: number, days: number, depositAmount: number = 0) => {
  const rentalAmount = dailyRate * days;
  const platformFee = rentalAmount * 0.05; // 5% platform fee
  const vatAmount = (rentalAmount + platformFee) * 0.075; // 7.5% VAT
  const totalAmount = rentalAmount + platformFee + vatAmount + depositAmount;
  const ownerPayout = rentalAmount - (rentalAmount * 0.05); // Owner gets 95%
  
  return {
    rentalAmount,
    platformFee,
    vatAmount,
    depositAmount,
    totalAmount,
    ownerPayout,
    days,
  };
};
