// Booking Lifecycle Management Utilities

export type BookingStatus = 
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'pending_payment'
  | 'confirmed'
  | 'delivering'
  | 'on_hire'
  | 'return_due'
  | 'returned'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type PaymentStatus = 
  | 'pending'
  | 'awaiting_verification'
  | 'confirmed'
  | 'refunded'
  | 'failed';

export interface BookingStage {
  id: BookingStatus;
  label: string;
  description: string;
  icon: string;
  order: number;
}

// Define the booking lifecycle stages in order
export const BOOKING_STAGES: BookingStage[] = [
  { id: 'requested', label: 'Requested', description: 'Booking request submitted', icon: 'FileText', order: 1 },
  { id: 'accepted', label: 'Accepted', description: 'Owner accepted the request', icon: 'CheckCircle', order: 2 },
  { id: 'pending_payment', label: 'Awaiting Payment', description: 'Waiting for payment confirmation', icon: 'CreditCard', order: 3 },
  { id: 'confirmed', label: 'Confirmed', description: 'Payment confirmed, booking active', icon: 'Shield', order: 4 },
  { id: 'delivering', label: 'Dispatched', description: 'Equipment is being delivered', icon: 'Truck', order: 5 },
  { id: 'on_hire', label: 'In Use', description: 'Equipment is on hire', icon: 'Package', order: 6 },
  { id: 'return_due', label: 'Return Due', description: 'Rental period ended, awaiting return', icon: 'Clock', order: 7 },
  { id: 'returned', label: 'Returned', description: 'Equipment returned, pending confirmation', icon: 'RotateCcw', order: 8 },
  { id: 'completed', label: 'Completed', description: 'Booking successfully completed', icon: 'CheckCircle2', order: 9 },
];

// Terminal states that end the booking flow
export const TERMINAL_STATES: BookingStatus[] = ['completed', 'cancelled', 'rejected', 'disputed'];

// Valid status transitions map
export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ['accepted', 'rejected', 'cancelled'],
  accepted: ['pending_payment', 'cancelled'],
  rejected: [], // Terminal state
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['delivering', 'on_hire', 'cancelled'],
  delivering: ['on_hire', 'cancelled'],
  on_hire: ['return_due', 'returned', 'disputed'],
  return_due: ['returned', 'disputed'],
  returned: ['completed', 'disputed'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  disputed: ['completed', 'cancelled'], // Can be resolved
};

// Who can perform which transitions
export const TRANSITION_PERMISSIONS: Record<string, { from: BookingStatus; to: BookingStatus; roles: ('contractor' | 'owner' | 'admin')[] }[]> = {
  contractor: [
    { from: 'requested', to: 'cancelled', roles: ['contractor'] },
    { from: 'accepted', to: 'cancelled', roles: ['contractor'] },
    { from: 'pending_payment', to: 'cancelled', roles: ['contractor'] },
    { from: 'on_hire', to: 'returned', roles: ['contractor'] },
    { from: 'on_hire', to: 'disputed', roles: ['contractor'] },
  ],
  owner: [
    { from: 'requested', to: 'accepted', roles: ['owner'] },
    { from: 'requested', to: 'rejected', roles: ['owner'] },
    { from: 'accepted', to: 'pending_payment', roles: ['owner'] },
    { from: 'confirmed', to: 'delivering', roles: ['owner'] },
    { from: 'confirmed', to: 'on_hire', roles: ['owner'] },
    { from: 'delivering', to: 'on_hire', roles: ['owner'] },
    { from: 'returned', to: 'completed', roles: ['owner'] },
    { from: 'returned', to: 'disputed', roles: ['owner'] },
  ],
  admin: [
    { from: 'disputed', to: 'completed', roles: ['admin'] },
    { from: 'disputed', to: 'cancelled', roles: ['admin'] },
  ],
};

// Check if a transition is valid
export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// Check if user can perform a specific transition
export function canPerformTransition(
  from: BookingStatus,
  to: BookingStatus,
  userRole: 'contractor' | 'owner' | 'admin'
): boolean {
  if (!isValidTransition(from, to)) return false;
  
  const permissions = TRANSITION_PERMISSIONS[userRole] || [];
  return permissions.some(p => p.from === from && p.to === to);
}

// Get current stage index (0-based)
export function getCurrentStageIndex(status: BookingStatus): number {
  const stage = BOOKING_STAGES.find(s => s.id === status);
  return stage ? stage.order - 1 : -1;
}

// Check if a stage is completed based on current status
export function isStageCompleted(stageId: BookingStatus, currentStatus: BookingStatus): boolean {
  const stageOrder = BOOKING_STAGES.find(s => s.id === stageId)?.order ?? 0;
  const currentOrder = BOOKING_STAGES.find(s => s.id === currentStatus)?.order ?? 0;
  return stageOrder < currentOrder;
}

// Check if a stage is the current active stage
export function isCurrentStage(stageId: BookingStatus, currentStatus: BookingStatus): boolean {
  return stageId === currentStatus;
}

// Get display label for payment status
export function getPaymentStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    awaiting_verification: 'Paid (Pending Verification)',
    confirmed: 'Paid (Confirmed)',
    refunded: 'Refunded',
    failed: 'Failed',
  };
  return labels[status || 'pending'] || 'Pending';
}

// Get actions available to contractor for a booking
export function getContractorActions(status: BookingStatus, paymentStatus: string | null): string[] {
  const actions: string[] = [];
  
  if (status === 'accepted' || status === 'pending_payment') {
    if (paymentStatus === 'pending') {
      actions.push('mark_as_paid');
    }
  }
  
  if (['requested', 'accepted', 'pending_payment'].includes(status)) {
    actions.push('cancel');
  }
  
  if (status === 'on_hire' || status === 'return_due') {
    actions.push('mark_returned');
  }
  
  return actions;
}

// Get actions available to owner for a booking
export function getOwnerActions(status: BookingStatus, paymentStatus: string | null): string[] {
  const actions: string[] = [];
  
  if (status === 'requested') {
    actions.push('accept', 'reject');
  }
  
  if (status === 'pending_payment' && paymentStatus === 'awaiting_verification') {
    actions.push('confirm_payment');
  }
  
  if (status === 'confirmed') {
    actions.push('mark_dispatched', 'mark_delivered');
  }
  
  if (status === 'delivering') {
    actions.push('mark_delivered');
  }
  
  if (status === 'returned') {
    actions.push('confirm_return', 'raise_dispute');
  }
  
  return actions;
}

// Get human-readable action label
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    mark_as_paid: 'Mark as Paid',
    cancel: 'Cancel Booking',
    mark_returned: 'Mark as Returned',
    accept: 'Accept Request',
    reject: 'Reject Request',
    confirm_payment: 'Confirm Payment',
    mark_dispatched: 'Mark as Dispatched',
    mark_delivered: 'Mark as Delivered',
    confirm_return: 'Confirm Return',
    raise_dispute: 'Report Issue',
  };
  return labels[action] || action;
}

// Status color mapping
export const STATUS_COLORS: Record<BookingStatus, string> = {
  requested: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  accepted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  pending_payment: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  delivering: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  on_hire: 'bg-primary/10 text-primary border-primary/20',
  return_due: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  returned: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  completed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  cancelled: 'bg-muted text-muted-foreground border-muted',
  disputed: 'bg-red-500/10 text-red-600 border-red-500/20',
};

// Payment status colors
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  awaiting_verification: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  refunded: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
};
