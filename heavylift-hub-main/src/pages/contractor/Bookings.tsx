import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatNaira } from '@/types';
import { Calendar, MapPin, ChevronRight, Package, CreditCard, User, Clock, FileText, X, Star, CheckCircle, Banknote } from 'lucide-react';
import { PageTransition, StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/ui/animated-container';
import { ListItemSkeleton } from '@/components/ui/loading-skeleton';
import { NoBookings } from '@/components/ui/empty-state';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { BookingProgressStepper } from '@/components/bookings/BookingProgressStepper';
import { useBookingStatusLog } from '@/hooks/useBookingStatusLog';
import { 
  STATUS_COLORS, 
  PAYMENT_STATUS_COLORS, 
  getPaymentStatusLabel,
  type BookingStatus 
} from '@/lib/bookingLifecycle';

interface StatusLog {
  id: string;
  new_status: string;
  action_type: string;
  performed_by_role: string;
  notes: string | null;
  created_at: string;
}

interface Booking {
  id: string;
  booking_number: string;
  status: BookingStatus;
  total_amount: number;
  rental_amount: number;
  platform_fee: number;
  vat_amount: number;
  deposit_amount: number | null;
  start_date: string;
  end_date: string;
  site_location: string;
  site_address: string | null;
  special_requirements: string | null;
  contractor_notes: string | null;
  owner_notes: string | null;
  payment_status: string | null;
  created_at: string;
  owner_id: string | null;
  equipment: {
    id: string;
    title: string;
    make: string;
    model: string;
    images: string[];
    daily_rate: number;
  } | null;
  owner_profile: {
    full_name: string | null;
    phone: string | null;
    company_name: string | null;
  } | null;
}

const ContractorBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logStatusChange, fetchStatusLogs } = useBookingStatusLog();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchReviewedBookings();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBooking) {
      loadStatusLogs(selectedBooking.id);
    }
  }, [selectedBooking?.id]);

  const loadStatusLogs = async (bookingId: string) => {
    const { data } = await fetchStatusLogs(bookingId);
    if (data) {
      setStatusLogs(data as StatusLog[]);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_number,
          status,
          total_amount,
          rental_amount,
          platform_fee,
          vat_amount,
          deposit_amount,
          start_date,
          end_date,
          site_location,
          site_address,
          special_requirements,
          contractor_notes,
          owner_notes,
          payment_status,
          created_at,
          owner_id,
          equipment_id
        `)
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        setIsLoading(false);
        return;
      }

      // Fetch equipment separately
      const equipmentIds = [...new Set(bookingsData.map(b => b.equipment_id).filter(Boolean))];
      let equipmentMap = new Map();
      
      if (equipmentIds.length > 0) {
        const { data: equipmentData } = await supabase
          .from('equipment')
          .select('id, title, make, model, images, daily_rate')
          .in('id', equipmentIds);
        
        equipmentMap = new Map(equipmentData?.map(e => [e.id, e]) || []);
      }

      // Fetch owner profiles separately
      const ownerIds = [...new Set(bookingsData.map(b => b.owner_id).filter(Boolean))];
      let profileMap = new Map();
      
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone, company_name')
          .in('id', ownerIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      }

      const bookingsWithDetails = bookingsData.map(b => ({
        ...b,
        equipment: b.equipment_id ? equipmentMap.get(b.equipment_id) || null : null,
        owner_profile: b.owner_id ? profileMap.get(b.owner_id) || null : null
      }));

      setBookings(bookingsWithDetails as Booking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviewedBookings = async () => {
    if (!user) return;

    const { data: reviews } = await supabase
      .from('reviews')
      .select('booking_id')
      .eq('reviewer_id', user.id);

    if (reviews) {
      setReviewedBookings(new Set(reviews.map(r => r.booking_id)));
    }
  };

  const hasReviewed = (bookingId: string) => reviewedBookings.has(bookingId);

  const canLeaveReview = (booking: Booking) => {
    return booking.status === 'completed' && !hasReviewed(booking.id);
  };

  const canMarkAsPaid = (booking: Booking) => {
    return ['accepted', 'pending_payment'].includes(booking.status) && 
           (booking.payment_status === 'pending' || !booking.payment_status);
  };

  const filteredBookings = activeTab === 'all' 
    ? bookings 
    : bookings.filter(b => {
        if (activeTab === 'active') return ['on_hire', 'return_due', 'delivering', 'confirmed'].includes(b.status);
        if (activeTab === 'pending') return ['requested', 'accepted', 'pending_payment'].includes(b.status);
        return b.status === activeTab;
      });

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setStatusLogs([]);
    setIsDetailOpen(true);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedBooking) return;
    
    setIsMarkingPaid(true);
    try {
      const previousStatus = selectedBooking.status;
      const previousPaymentStatus = selectedBooking.payment_status;
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          payment_status: 'awaiting_verification',
          status: 'pending_payment'
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Log the status change
      await logStatusChange({
        bookingId: selectedBooking.id,
        previousStatus: previousPaymentStatus,
        newStatus: 'awaiting_verification',
        actionType: 'payment_update',
        role: 'contractor',
        notes: paymentReference ? `Payment reference: ${paymentReference}` : 'Payment marked as made by contractor',
      });

      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, payment_status: 'awaiting_verification', status: 'pending_payment' as BookingStatus } 
          : b
      ));
      
      setSelectedBooking(prev => prev ? { 
        ...prev, 
        payment_status: 'awaiting_verification',
        status: 'pending_payment' as BookingStatus
      } : null);
      
      toast.success('Payment marked as made. Awaiting owner verification.');
      setIsPaymentDialogOpen(false);
      setPaymentReference('');
      loadStatusLogs(selectedBooking.id);
    } catch (error) {
      console.error('Error marking payment:', error);
      toast.error('Failed to update payment status');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    setIsCancelling(true);
    try {
      const previousStatus = selectedBooking.status;
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: cancelReason || 'Cancelled by contractor',
          cancelled_by: 'contractor'
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Log the cancellation
      await logStatusChange({
        bookingId: selectedBooking.id,
        previousStatus,
        newStatus: 'cancelled',
        actionType: 'cancellation',
        role: 'contractor',
        notes: cancelReason || 'Cancelled by contractor',
      });

      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id ? { ...b, status: 'cancelled' as BookingStatus } : b
      ));
      
      toast.success('Booking cancelled successfully');
      setIsCancelDialogOpen(false);
      setIsDetailOpen(false);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancelBooking = (status: string) => {
    return ['requested', 'accepted', 'pending_payment'].includes(status);
  };

  const canCompleteBooking = (status: string) => {
    return status === 'on_hire';
  };

  const handleCompleteBooking = async () => {
    if (!selectedBooking) return;
    
    setIsCompleting(true);
    try {
      const previousStatus = selectedBooking.status;
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'returned' })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Log the status change
      await logStatusChange({
        bookingId: selectedBooking.id,
        previousStatus,
        newStatus: 'returned',
        actionType: 'status_change',
        role: 'contractor',
        notes: 'Equipment marked as returned by contractor',
      });

      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id ? { ...b, status: 'returned' as BookingStatus } : b
      ));
      
      toast.success('Equipment marked as returned. Waiting for owner confirmation.');
      setIsCompleteDialogOpen(false);
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to complete booking');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">Manage your equipment rentals</p>
      </motion.div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TabsList>
            <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({bookings.filter(b => ['on_hire', 'return_due', 'delivering', 'confirmed'].includes(b.status)).length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({bookings.filter(b => ['requested', 'accepted', 'pending_payment'].includes(b.status)).length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({bookings.filter(b => b.status === 'completed').length})
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <NoBookings onBrowse={() => navigate('/equipment')} />
          ) : (
            <StaggerContainer className="space-y-4">
              {filteredBookings.map((booking) => (
                <StaggerItem key={booking.id}>
                  <ScaleOnHover scale={1.01}>
                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold">{booking.equipment?.title || 'Equipment'}</h3>
                              <Badge className={STATUS_COLORS[booking.status] || STATUS_COLORS.requested}>
                                {booking.status.replace('_', ' ')}
                              </Badge>
                              {booking.payment_status && booking.payment_status !== 'pending' && (
                                <Badge variant="outline" className={PAYMENT_STATUS_COLORS[booking.payment_status] || ''}>
                                  {getPaymentStatusLabel(booking.payment_status)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />{booking.site_location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                              </span>
                              <span className="font-medium text-foreground">{formatNaira(booking.total_amount)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">#{booking.booking_number}</p>
                          </div>
                          <div className="flex gap-2">
                            {canMarkAsPaid(booking) && (
                              <Button 
                                variant="default" 
                                size="sm"
                                className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(booking);
                                  setIsPaymentDialogOpen(true);
                                }}
                              >
                                <Banknote className="h-4 w-4" />
                                Mark as Paid
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              className="gap-2 group"
                              onClick={() => handleViewDetails(booking)}
                            >
                              View Details
                              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ScaleOnHover>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Booking #{selectedBooking.booking_number}</span>
                  <Badge className={STATUS_COLORS[selectedBooking.status] || STATUS_COLORS.requested}>
                    {selectedBooking.status.replace('_', ' ')}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Booking Progress Stepper */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-4 text-sm text-muted-foreground">Booking Progress</h4>
                  <BookingProgressStepper 
                    currentStatus={selectedBooking.status} 
                    statusLogs={statusLogs}
                  />
                </div>

                {/* Equipment Info */}
                <div className="flex gap-4">
                  {selectedBooking.equipment?.images?.[0] && (
                    <img 
                      src={selectedBooking.equipment.images[0]} 
                      alt={selectedBooking.equipment.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedBooking.equipment?.title || 'Equipment'}</h3>
                    <p className="text-muted-foreground">
                      {selectedBooking.equipment?.make} {selectedBooking.equipment?.model}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatNaira(selectedBooking.equipment?.daily_rate || 0)}/day
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Rental Period */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4" /> Rental Period
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(new Date(selectedBooking.start_date), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium">{format(new Date(selectedBooking.end_date), 'PPP')}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Location */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4" /> Site Location
                  </h4>
                  <p className="text-sm">{selectedBooking.site_location}</p>
                  {selectedBooking.site_address && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedBooking.site_address}</p>
                  )}
                </div>

                {/* Owner Info */}
                {selectedBooking.owner_profile && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <User className="h-4 w-4" /> Equipment Owner
                      </h4>
                      <div className="text-sm space-y-1">
                        <p>{selectedBooking.owner_profile.full_name || 'N/A'}</p>
                        {selectedBooking.owner_profile.company_name && (
                          <p className="text-muted-foreground">{selectedBooking.owner_profile.company_name}</p>
                        )}
                        {selectedBooking.owner_profile.phone && (
                          <p className="text-muted-foreground">{selectedBooking.owner_profile.phone}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Special Requirements */}
                {selectedBooking.special_requirements && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4" /> Special Requirements
                      </h4>
                      <p className="text-sm text-muted-foreground">{selectedBooking.special_requirements}</p>
                    </div>
                  </>
                )}

                {/* Notes */}
                {(selectedBooking.contractor_notes || selectedBooking.owner_notes) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4" /> Notes
                      </h4>
                      {selectedBooking.contractor_notes && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground">Your Notes</p>
                          <p className="text-sm">{selectedBooking.contractor_notes}</p>
                        </div>
                      )}
                      {selectedBooking.owner_notes && (
                        <div>
                          <p className="text-xs text-muted-foreground">Owner Notes</p>
                          <p className="text-sm">{selectedBooking.owner_notes}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Payment Details */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4" /> Payment Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rental Amount</span>
                      <span>{formatNaira(selectedBooking.rental_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fee</span>
                      <span>{formatNaira(selectedBooking.platform_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT</span>
                      <span>{formatNaira(selectedBooking.vat_amount)}</span>
                    </div>
                    {selectedBooking.deposit_amount && selectedBooking.deposit_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deposit</span>
                        <span>{formatNaira(selectedBooking.deposit_amount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatNaira(selectedBooking.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Payment Status</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${PAYMENT_STATUS_COLORS[selectedBooking.payment_status || 'pending'] || ''}`}
                      >
                        {getPaymentStatusLabel(selectedBooking.payment_status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Booked on {format(new Date(selectedBooking.created_at), 'PPP')}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {selectedBooking.equipment?.id && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setIsDetailOpen(false);
                        navigate(`/equipment/${selectedBooking.equipment?.id}`);
                      }}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      View Equipment
                    </Button>
                  )}
                  {canMarkAsPaid(selectedBooking) && (
                    <Button 
                      variant="default" 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setIsPaymentDialogOpen(true)}
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                  )}
                  {canLeaveReview(selectedBooking) && (
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => setIsReviewOpen(true)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Leave Review
                    </Button>
                  )}
                  {canCompleteBooking(selectedBooking.status) && (
                    <Button 
                      variant="default" 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setIsCompleteDialogOpen(true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Returned
                    </Button>
                  )}
                  {canCancelBooking(selectedBooking.status) && (
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => setIsCancelDialogOpen(true)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  )}
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => setIsDetailOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <AlertDialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Made</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm that you have made payment for this booking. The equipment owner will need to verify the payment before confirming the booking.
              {selectedBooking && (
                <span className="block mt-2 font-medium text-foreground">
                  Booking #{selectedBooking.booking_number} - {formatNaira(selectedBooking.total_amount)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="payment-reference">Payment Reference (optional)</Label>
            <Textarea
              id="payment-reference"
              placeholder="e.g., Bank transfer reference, receipt number..."
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarkingPaid}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsPaid}
              disabled={isMarkingPaid}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isMarkingPaid ? 'Confirming...' : 'Confirm Payment Made'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Booking Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
              {selectedBooking && (
                <span className="block mt-2 font-medium text-foreground">
                  Booking #{selectedBooking.booking_number} - {selectedBooking.equipment?.title}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Please provide a reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Booking Confirmation Dialog */}
      <AlertDialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Equipment as Returned?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm that you have finished using the equipment and returned it to the owner. The owner will need to confirm receipt before the booking is completed.
              {selectedBooking && (
                <span className="block mt-2 font-medium text-foreground">
                  Booking #{selectedBooking.booking_number} - {selectedBooking.equipment?.title}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteBooking}
              disabled={isCompleting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isCompleting ? 'Completing...' : 'Yes, Mark as Returned'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Form Dialog */}
      {selectedBooking && selectedBooking.equipment && selectedBooking.owner_id && (
        <ReviewForm
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          bookingId={selectedBooking.id}
          equipmentId={selectedBooking.equipment.id}
          ownerId={selectedBooking.owner_id}
          equipmentTitle={selectedBooking.equipment.title}
          onReviewSubmitted={() => {
            fetchReviewedBookings();
            setIsDetailOpen(false);
          }}
        />
      )}
    </PageTransition>
  );
};

export default ContractorBookings;
