import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatNaira } from '@/types';
import { Check, X, MessageSquare, Calendar, MapPin, User, FileText, CreditCard, Clock, ChevronRight, Package, CheckCircle, AlertTriangle, Upload, ImageIcon, Trash2, Truck, Play, RotateCcw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageTransition, StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/ui/animated-container';
import { ListItemSkeleton } from '@/components/ui/loading-skeleton';
import { NoRequests } from '@/components/ui/empty-state';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface BookingWithDetails {
  id: string;
  booking_number: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  rental_amount: number;
  platform_fee: number;
  vat_amount: number;
  deposit_amount: number | null;
  owner_payout: number | null;
  status: BookingStatus;
  site_location: string;
  site_address: string | null;
  special_requirements: string | null;
  contractor_notes: string | null;
  owner_notes: string | null;
  payment_status: string | null;
  created_at: string;
  contractor_id: string;
  equipment: {
    id: string;
    title: string;
    make: string;
    model: string;
    images: string[];
    daily_rate: number;
  } | null;
  contractor_profile: {
    full_name: string | null;
    company_name: string | null;
    rating: number | null;
    phone: string | null;
  } | null;
}

const OwnerRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { logStatusChange, fetchStatusLogs } = useBookingStatusLog();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [activeTab, setActiveTab] = useState('requested');
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmReturnOpen, setIsConfirmReturnOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // New status update states
  const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isDeliverOpen, setIsDeliverOpen] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchBookings();
    }
  }, [user?.id]);

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
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, booking_number, start_date, end_date, total_amount, rental_amount, platform_fee, vat_amount,
          deposit_amount, owner_payout, status, site_location, site_address, special_requirements,
          contractor_notes, owner_notes, payment_status, created_at, contractor_id,
          equipment:equipment_id (id, title, make, model, images, daily_rate)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch contractor profiles separately
      const contractorIds = [...new Set(data?.map(b => b.contractor_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, rating, phone')
        .in('id', contractorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const bookingsWithProfiles = data?.map(b => ({
        ...b,
        contractor_profile: b.contractor_id ? profileMap.get(b.contractor_id) || null : null
      })) || [];

      setBookings(bookingsWithProfiles as BookingWithDetails[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load booking requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: BookingStatus, notes?: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    try {
      const previousStatus = booking.status;
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Log the status change
      await logStatusChange({
        bookingId,
        previousStatus,
        newStatus,
        actionType: 'status_change',
        role: 'owner',
        notes: notes || `Status changed from ${previousStatus} to ${newStatus}`,
      });

      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
      
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
        loadStatusLogs(bookingId);
      }
      
      toast.success(`Booking ${newStatus === 'accepted' ? 'accepted' : newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedBooking) return;
    
    setIsConfirmingPayment(true);
    try {
      const previousStatus = selectedBooking.status;
      const previousPaymentStatus = selectedBooking.payment_status;
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          payment_status: 'confirmed',
          status: 'confirmed'
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Log the payment confirmation
      await logStatusChange({
        bookingId: selectedBooking.id,
        previousStatus: previousPaymentStatus,
        newStatus: 'confirmed',
        actionType: 'payment_update',
        role: 'owner',
        notes: 'Payment verified and confirmed by owner',
      });

      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, payment_status: 'confirmed', status: 'confirmed' as BookingStatus } 
          : b
      ));
      
      setSelectedBooking(prev => prev ? { 
        ...prev, 
        payment_status: 'confirmed',
        status: 'confirmed' as BookingStatus
      } : null);
      
      toast.success('Payment confirmed. Booking is now active!');
      setIsConfirmPaymentOpen(false);
      loadStatusLogs(selectedBooking.id);
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleDispatch = async () => {
    if (!selectedBooking) return;
    
    setIsDispatching(true);
    try {
      await handleUpdateStatus(selectedBooking.id, 'delivering', 'Equipment dispatched for delivery');
      setIsDispatchOpen(false);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDeliver = async () => {
    if (!selectedBooking) return;
    
    setIsDelivering(true);
    try {
      await handleUpdateStatus(selectedBooking.id, 'on_hire', 'Equipment delivered and now in use');
      setIsDeliverOpen(false);
    } finally {
      setIsDelivering(false);
    }
  };

  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setStatusLogs([]);
    setIsDetailOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedBooking) return;
    
    setIsConfirming(true);
    try {
      const previousStatus = selectedBooking.status;
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Log the completion
      await logStatusChange({
        bookingId: selectedBooking.id,
        previousStatus,
        newStatus: 'completed',
        actionType: 'status_change',
        role: 'owner',
        notes: 'Equipment return confirmed, booking completed',
      });

      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id ? { ...b, status: 'completed' as BookingStatus } : b
      ));
      
      toast.success('Return confirmed. Booking completed!');
      setIsConfirmReturnOpen(false);
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Error confirming return:', error);
      toast.error('Failed to confirm return');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + evidenceFiles.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setEvidenceFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEvidencePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    setEvidencePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadEvidenceFiles = async (): Promise<string[]> => {
    if (!user?.id || evidenceFiles.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const file of evidenceFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('dispute-evidence')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('dispute-evidence')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

  const handleDisputeReturn = async () => {
    if (!selectedBooking || !user?.id || !disputeReason.trim()) return;
    
    setIsDisputing(true);
    try {
      setIsUploading(true);
      const evidenceUrls = await uploadEvidenceFiles();
      setIsUploading(false);

      const { error: disputeError } = await supabase
        .from('disputes')
        .insert({
          booking_id: selectedBooking.id,
          raised_by: user.id,
          raised_by_role: 'owner',
          reason: 'Equipment damage on return',
          description: disputeReason.trim(),
          status: 'open',
          evidence: evidenceUrls
        });

      if (disputeError) throw disputeError;

      const previousStatus = selectedBooking.status;
      
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'disputed' })
        .eq('id', selectedBooking.id);

      if (bookingError) throw bookingError;

      // Log the dispute
      await logStatusChange({
        bookingId: selectedBooking.id,
        previousStatus,
        newStatus: 'disputed',
        actionType: 'dispute',
        role: 'owner',
        notes: disputeReason.trim(),
      });

      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id ? { ...b, status: 'disputed' as BookingStatus } : b
      ));
      
      toast.success('Dispute raised. Our team will review and contact both parties.');
      setIsDisputeOpen(false);
      setIsDetailOpen(false);
      setDisputeReason('');
      setEvidenceFiles([]);
      setEvidencePreviews([]);
    } catch (error) {
      console.error('Error raising dispute:', error);
      toast.error('Failed to raise dispute');
    } finally {
      setIsDisputing(false);
      setIsUploading(false);
    }
  };

  // Helper functions for conditional rendering
  const canConfirmPayment = (booking: BookingWithDetails) => {
    return booking.status === 'pending_payment' && booking.payment_status === 'awaiting_verification';
  };

  const canDispatch = (booking: BookingWithDetails) => {
    return booking.status === 'confirmed';
  };

  const canDeliver = (booking: BookingWithDetails) => {
    return booking.status === 'delivering' || booking.status === 'confirmed';
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'requested') return b.status === 'requested';
    if (activeTab === 'active') return ['accepted', 'pending_payment', 'confirmed', 'delivering', 'on_hire', 'return_due', 'returned'].includes(b.status);
    if (activeTab === 'completed') return ['completed', 'rejected', 'cancelled'].includes(b.status);
    return true;
  });

  return (
    <PageTransition className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Booking Requests</h1>
        <p className="text-muted-foreground">Review and manage rental requests</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requested">
            Pending ({bookings.filter(b => b.status === 'requested').length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({bookings.filter(b => ['accepted', 'pending_payment', 'confirmed', 'delivering', 'on_hire', 'returned'].includes(b.status)).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Past ({bookings.filter(b => ['completed', 'rejected', 'cancelled'].includes(b.status)).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <NoRequests />
          ) : (
            <StaggerContainer className="space-y-4">
              {filteredBookings.map((booking) => (
                <StaggerItem key={booking.id}>
                  <ScaleOnHover scale={1.01}>
                    <Card className="transition-shadow hover:shadow-md overflow-hidden relative">
                      <motion.div 
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          booking.status === 'requested' ? 'bg-amber-500' : 
                          booking.status === 'on_hire' ? 'bg-primary' : 
                          booking.status === 'completed' ? 'bg-emerald-500' :
                          booking.status === 'pending_payment' ? 'bg-orange-500' :
                          booking.status === 'confirmed' ? 'bg-emerald-500' :
                          booking.status === 'delivering' ? 'bg-purple-500' : 'bg-muted'
                        }`}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.2 }}
                      />
                      <CardContent className="p-6 pl-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 200 }}
                            >
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {booking.contractor_profile?.full_name?.slice(0, 2).toUpperCase() || 'CN'}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold">{booking.contractor_profile?.full_name || 'Contractor'}</h3>
                                {booking.contractor_profile?.rating && (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                    ⭐ {booking.contractor_profile.rating.toFixed(1)}
                                  </Badge>
                                )}
                                <Badge variant="outline" className={STATUS_COLORS[booking.status] || 'bg-muted text-muted-foreground'}>
                                  {booking.status.replace('_', ' ')}
                                </Badge>
                                {booking.payment_status && booking.payment_status !== 'pending' && (
                                  <Badge variant="outline" className={PAYMENT_STATUS_COLORS[booking.payment_status] || ''}>
                                    {getPaymentStatusLabel(booking.payment_status)}
                                  </Badge>
                                )}
                              </div>
                              {booking.contractor_profile?.company_name && (
                                <p className="text-sm text-muted-foreground">{booking.contractor_profile.company_name}</p>
                              )}
                              <div className="mt-2 text-sm space-y-1">
                                <p><span className="text-muted-foreground">Equipment:</span> {booking.equipment?.title || 'N/A'}</p>
                                <p className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Dates:</span> {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                                </p>
                                <p>
                                  <span className="text-muted-foreground">Your Payout:</span>{' '}
                                  <span className="font-semibold text-emerald-600">{formatNaira(booking.owner_payout || booking.total_amount * 0.9)}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1 group"
                              onClick={() => handleViewDetails(booking)}
                            >
                              View Details
                              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1">
                              <MessageSquare className="h-4 w-4" /> Message
                            </Button>
                            {booking.status === 'requested' && (
                              <>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="gap-1 group"
                                  onClick={() => handleUpdateStatus(booking.id, 'rejected', 'Request rejected by owner')}
                                >
                                  <X className="h-4 w-4 group-hover:rotate-90 transition-transform" /> Reject
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="gap-1 group"
                                  onClick={() => handleUpdateStatus(booking.id, 'accepted', 'Request accepted by owner')}
                                >
                                  <Check className="h-4 w-4 group-hover:scale-110 transition-transform" /> Accept
                                </Button>
                              </>
                            )}
                            {canConfirmPayment(booking) && (
                              <Button 
                                size="sm" 
                                className="gap-1 group bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setIsConfirmPaymentOpen(true);
                                }}
                              >
                                <CreditCard className="h-4 w-4" /> Confirm Payment
                              </Button>
                            )}
                            {canDispatch(booking) && (
                              <Button 
                                size="sm" 
                                className="gap-1 group bg-purple-600 hover:bg-purple-700"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setIsDispatchOpen(true);
                                }}
                              >
                                <Truck className="h-4 w-4" /> Dispatch
                              </Button>
                            )}
                            {booking.status === 'delivering' && (
                              <Button 
                                size="sm" 
                                className="gap-1 group bg-primary hover:bg-primary/90"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setIsDeliverOpen(true);
                                }}
                              >
                                <Play className="h-4 w-4" /> Mark Delivered
                              </Button>
                            )}
                            {booking.status === 'returned' && (
                              <Button 
                                size="sm" 
                                className="gap-1 group bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleViewDetails(booking)}
                              >
                                <CheckCircle className="h-4 w-4 group-hover:scale-110 transition-transform" /> Confirm Return
                              </Button>
                            )}
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
                  <Badge className={STATUS_COLORS[selectedBooking.status] || 'bg-muted text-muted-foreground'}>
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

                {/* Contractor Info */}
                {selectedBooking.contractor_profile && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <User className="h-4 w-4" /> Contractor
                      </h4>
                      <div className="text-sm space-y-1">
                        <p>{selectedBooking.contractor_profile.full_name || 'N/A'}</p>
                        {selectedBooking.contractor_profile.company_name && (
                          <p className="text-muted-foreground">{selectedBooking.contractor_profile.company_name}</p>
                        )}
                        {selectedBooking.contractor_profile.phone && (
                          <p className="text-muted-foreground">{selectedBooking.contractor_profile.phone}</p>
                        )}
                        {selectedBooking.contractor_profile.rating && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            ⭐ {selectedBooking.contractor_profile.rating.toFixed(1)} rating
                          </Badge>
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
                          <p className="text-xs text-muted-foreground">Contractor Notes</p>
                          <p className="text-sm">{selectedBooking.contractor_notes}</p>
                        </div>
                      )}
                      {selectedBooking.owner_notes && (
                        <div>
                          <p className="text-xs text-muted-foreground">Your Notes</p>
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
                      <span>-{formatNaira(selectedBooking.platform_fee)}</span>
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Booking Value</span>
                      <span>{formatNaira(selectedBooking.total_amount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-emerald-600">
                      <span>Your Payout</span>
                      <span>{formatNaira(selectedBooking.owner_payout || selectedBooking.total_amount * 0.9)}</span>
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
                  Request received on {format(new Date(selectedBooking.created_at), 'PPP')}
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
                  {selectedBooking.status === 'requested' && (
                    <>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => {
                          handleUpdateStatus(selectedBooking.id, 'rejected', 'Request rejected by owner');
                          setIsDetailOpen(false);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button 
                        variant="default" 
                        className="flex-1"
                        onClick={() => {
                          handleUpdateStatus(selectedBooking.id, 'accepted', 'Request accepted by owner');
                          setIsDetailOpen(false);
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                    </>
                  )}
                  {canConfirmPayment(selectedBooking) && (
                    <Button 
                      variant="default" 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setIsConfirmPaymentOpen(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Confirm Payment
                    </Button>
                  )}
                  {canDispatch(selectedBooking) && (
                    <Button 
                      variant="default" 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => setIsDispatchOpen(true)}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Mark as Dispatched
                    </Button>
                  )}
                  {selectedBooking.status === 'delivering' && (
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => setIsDeliverOpen(true)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Mark as Delivered
                    </Button>
                  )}
                  {selectedBooking.status === 'returned' && (
                    <>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => setIsDisputeOpen(true)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Report Issue
                      </Button>
                      <Button 
                        variant="default" 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setIsConfirmReturnOpen(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Return
                      </Button>
                    </>
                  )}
                  {!['requested', 'returned', 'confirmed', 'delivering'].includes(selectedBooking.status) && !canConfirmPayment(selectedBooking) && (
                    <Button 
                      variant="default" 
                      className="flex-1"
                      onClick={() => setIsDetailOpen(false)}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <AlertDialog open={isConfirmPaymentOpen} onOpenChange={setIsConfirmPaymentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Received?</AlertDialogTitle>
            <AlertDialogDescription>
              The contractor has marked this booking as paid. Please verify that you have received the payment before confirming.
              {selectedBooking && (
                <span className="block mt-2 font-medium text-foreground">
                  Booking #{selectedBooking.booking_number} - {formatNaira(selectedBooking.total_amount)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirmingPayment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              disabled={isConfirmingPayment}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isConfirmingPayment ? 'Confirming...' : 'Confirm Payment Received'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dispatch Equipment Dialog */}
      <AlertDialog open={isDispatchOpen} onOpenChange={setIsDispatchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Equipment as Dispatched?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm that you have dispatched the equipment for delivery to the contractor's site.
              {selectedBooking && (
                <span className="block mt-2 font-medium text-foreground">
                  Booking #{selectedBooking.booking_number} - {selectedBooking.equipment?.title}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDispatching}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDispatch}
              disabled={isDispatching}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isDispatching ? 'Updating...' : 'Mark as Dispatched'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Delivered Dialog */}
      <AlertDialog open={isDeliverOpen} onOpenChange={setIsDeliverOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Equipment as Delivered?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm that the equipment has been delivered to the contractor and is now in use.
              {selectedBooking && (
                <span className="block mt-2 font-medium text-foreground">
                  Booking #{selectedBooking.booking_number} - {selectedBooking.equipment?.title}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDelivering}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeliver}
              disabled={isDelivering}
              className="bg-primary hover:bg-primary/90"
            >
              {isDelivering ? 'Updating...' : 'Mark as Delivered'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Return Dialog */}
      <AlertDialog open={isConfirmReturnOpen} onOpenChange={setIsConfirmReturnOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Equipment Return?</AlertDialogTitle>
            <AlertDialogDescription>
              The contractor has marked this equipment as returned. Please confirm that you have received the equipment back.
              {selectedBooking && (
                <span className="block mt-2 font-medium text-foreground">
                  Booking #{selectedBooking.booking_number} - {selectedBooking.equipment?.title}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReturn}
              disabled={isConfirming}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isConfirming ? 'Confirming...' : 'Confirm Return'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dispute Return Dialog */}
      <AlertDialog open={isDisputeOpen} onOpenChange={(open) => {
        setIsDisputeOpen(open);
        if (!open) {
          setDisputeReason('');
          setEvidenceFiles([]);
          setEvidencePreviews([]);
        }
      }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Report Issue with Return</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>If the equipment was returned damaged or there are other issues, describe the problem below. Our team will review and assist in resolving the dispute.</p>
                {selectedBooking && (
                  <span className="block mt-2 font-medium text-foreground">
                    Booking #{selectedBooking.booking_number} - {selectedBooking.equipment?.title}
                  </span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dispute-reason" className="text-sm font-medium">
                Describe the issue <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="dispute-reason"
                placeholder="e.g., Equipment returned with scratches on the bucket, hydraulic leak detected..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
            
            {/* Photo Evidence Upload */}
            <div>
              <Label className="text-sm font-medium">
                Photo Evidence (optional, max 5 photos)
              </Label>
              <div className="mt-2 space-y-3">
                {evidencePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {evidencePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={preview} 
                          alt={`Evidence ${index + 1}`} 
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeEvidence(index)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {evidenceFiles.length < 5 && (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleEvidenceUpload}
                      className="hidden"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {evidenceFiles.length === 0 ? 'Upload photos' : 'Add more photos'}
                    </span>
                  </label>
                )}
                
                <p className="text-xs text-muted-foreground">
                  <ImageIcon className="h-3 w-3 inline mr-1" />
                  JPG, PNG, or WEBP up to 5MB each
                </p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisputing || isUploading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisputeReturn}
              disabled={isDisputing || isUploading || !disputeReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUploading ? 'Uploading...' : isDisputing ? 'Submitting...' : 'Raise Dispute'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default OwnerRequests;