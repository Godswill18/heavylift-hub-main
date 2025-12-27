import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/types';
import { ArrowLeft, Calendar, MapPin, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BookingDetail {
  id: string;
  booking_number: string;
  status: string;
  payment_status: string | null;
  escrow_status: string | null;
  start_date: string;
  end_date: string;
  site_location: string;
  site_address: string | null;
  rental_amount: number;
  platform_fee: number;
  vat_amount: number;
  deposit_amount: number | null;
  total_amount: number;
  owner_payout: number | null;
  contractor_notes: string | null;
  owner_notes: string | null;
  special_requirements: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  usage_hours_per_day: number | null;
  created_at: string;
  equipment: {
    id: string;
    title: string;
    category: string;
    daily_rate: number;
  } | null;
  contractor: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  owner: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
  } | null;
}

const statusColors: Record<string, string> = {
  requested: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  accepted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  pending_payment: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  delivering: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  on_hire: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  completed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  disputed: 'bg-red-500/10 text-red-600 border-red-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const allStatuses = [
  'requested', 'accepted', 'rejected', 'pending_payment', 'confirmed', 
  'delivering', 'on_hire', 'completed', 'cancelled', 'disputed'
];

const AdminBookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const fetchBooking = async () => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_number,
          status,
          payment_status,
          escrow_status,
          start_date,
          end_date,
          site_location,
          site_address,
          rental_amount,
          platform_fee,
          vat_amount,
          deposit_amount,
          total_amount,
          owner_payout,
          contractor_notes,
          owner_notes,
          special_requirements,
          cancellation_reason,
          cancelled_by,
          usage_hours_per_day,
          created_at,
          equipment_id,
          contractor_id,
          owner_id
        `)
        .eq('id', id)
        .maybeSingle();

      if (bookingError) throw bookingError;
      
      if (!bookingData) {
        toast.error('Booking not found');
        navigate('/admin/bookings');
        return;
      }

      // Fetch related data
      let equipment = null;
      let contractor = null;
      let owner = null;

      if (bookingData.equipment_id) {
        const { data } = await supabase
          .from('equipment')
          .select('id, title, category, daily_rate')
          .eq('id', bookingData.equipment_id)
          .maybeSingle();
        equipment = data;
      }

      if (bookingData.contractor_id) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .eq('id', bookingData.contractor_id)
          .maybeSingle();
        contractor = data;
      }

      if (bookingData.owner_id) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, company_name')
          .eq('id', bookingData.owner_id)
          .maybeSingle();
        owner = data;
      }

      setBooking({ ...bookingData, equipment, contractor, owner } as BookingDetail);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus as "accepted" | "cancelled" | "completed" | "confirmed" | "delivering" | "disputed" | "on_hire" | "pending_payment" | "rejected" | "requested" })
        .eq('id', booking.id);

      if (error) throw error;

      setBooking({ ...booking, status: newStatus });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const rentalDays = Math.ceil(
    (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/bookings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold font-mono">{booking.booking_number}</h1>
            <Badge className={statusColors[booking.status] || statusColors.requested}>
              {booking.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">Created {format(new Date(booking.created_at), 'MMM d, yyyy h:mm a')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Change status:</span>
          <Select value={booking.status} onValueChange={handleStatusChange} disabled={isUpdating}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allStatuses.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {booking.status === 'disputed' && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-600 font-medium">This booking has an active dispute</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate('/admin/disputes')}>
            View Disputes
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(booking.start_date), 'MMM d, yyyy')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                <span className="text-muted-foreground ml-2">({rentalDays} days)</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{booking.site_location}</span>
            </div>

            {booking.site_address && (
              <div className="text-sm">
                <span className="text-muted-foreground">Address: </span>
                {booking.site_address}
              </div>
            )}

            {booking.usage_hours_per_day && (
              <div className="text-sm">
                <span className="text-muted-foreground">Usage: </span>
                {booking.usage_hours_per_day} hours/day
              </div>
            )}

            {booking.special_requirements && (
              <div className="text-sm border-t pt-4">
                <span className="text-muted-foreground block mb-1">Special Requirements</span>
                <p>{booking.special_requirements}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
              <div>
                <span className="text-muted-foreground">Payment Status</span>
                <p className="font-medium capitalize">{booking.payment_status || 'pending'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Escrow Status</span>
                <p className="font-medium capitalize">{booking.escrow_status || 'none'}</p>
              </div>
            </div>

            {booking.cancellation_reason && (
              <div className="text-sm border-t pt-4">
                <span className="text-muted-foreground block mb-1">Cancellation Reason</span>
                <p className="text-red-600">{booking.cancellation_reason}</p>
                <span className="text-xs text-muted-foreground">Cancelled by: {booking.cancelled_by}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rental Amount</span>
              <span>{formatNaira(booking.rental_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee</span>
              <span>{formatNaira(booking.platform_fee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT</span>
              <span>{formatNaira(booking.vat_amount)}</span>
            </div>
            {booking.deposit_amount && booking.deposit_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deposit</span>
                <span>{formatNaira(booking.deposit_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-3 border-t">
              <span>Total Amount</span>
              <span>{formatNaira(booking.total_amount)}</span>
            </div>
            {booking.owner_payout && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Owner Payout</span>
                <span>{formatNaira(booking.owner_payout)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            {booking.equipment ? (
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Title</span>
                  <p className="font-medium">{booking.equipment.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Category</span>
                    <p className="font-medium capitalize">{booking.equipment.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Daily Rate</span>
                    <p className="font-medium">{formatNaira(booking.equipment.daily_rate)}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/admin/listings/${booking.equipment?.id}`)}
                >
                  View Listing
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Equipment information not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <span className="text-sm font-medium text-muted-foreground block mb-2">Contractor</span>
              {booking.contractor ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{booking.contractor.full_name || 'N/A'}</p>
                  <p>{booking.contractor.email}</p>
                  <p>{booking.contractor.phone || 'No phone'}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not available</p>
              )}
            </div>

            <div className="border-t pt-4">
              <span className="text-sm font-medium text-muted-foreground block mb-2">Owner</span>
              {booking.owner ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{booking.owner.full_name || 'N/A'}</p>
                  {booking.owner.company_name && <p>{booking.owner.company_name}</p>}
                  <p>{booking.owner.email}</p>
                  <p>{booking.owner.phone || 'No phone'}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {(booking.contractor_notes || booking.owner_notes) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              {booking.contractor_notes && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Contractor Notes</span>
                  <p className="text-sm">{booking.contractor_notes}</p>
                </div>
              )}
              {booking.owner_notes && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Owner Notes</span>
                  <p className="text-sm">{booking.owner_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminBookingDetail;
