import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatNaira } from '@/types';
import { Check, X, MessageSquare, Calendar, MapPin, User, FileText, CreditCard, Clock, ChevronRight, Package } from 'lucide-react';
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
  status: string;
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

const statusColors: Record<string, string> = {
  requested: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  accepted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  pending_payment: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  delivering: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  on_hire: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground',
  disputed: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const OwnerRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState('requested');
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchBookings();
    }
  }, [user?.id]);

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

  const handleUpdateStatus = async (bookingId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
      
      toast.success(`Booking ${newStatus === 'accepted' ? 'accepted' : 'rejected'}`);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'requested') return b.status === 'requested';
    if (activeTab === 'active') return ['accepted', 'confirmed', 'on_hire'].includes(b.status);
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
        <p className="text-muted-foreground">Review and respond to rental requests</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requested">
            Pending ({bookings.filter(b => b.status === 'requested').length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({bookings.filter(b => ['accepted', 'confirmed', 'on_hire'].includes(b.status)).length})
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
                          booking.status === 'completed' ? 'bg-emerald-500' : 'bg-muted'
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
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{booking.contractor_profile?.full_name || 'Contractor'}</h3>
                                {booking.contractor_profile?.rating && (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                    ⭐ {booking.contractor_profile.rating.toFixed(1)}
                                  </Badge>
                                )}
                                <Badge variant="outline" className={statusColors[booking.status] || 'bg-muted text-muted-foreground'}>
                                  {booking.status.replace('_', ' ')}
                                </Badge>
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
                                  onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                                >
                                  <X className="h-4 w-4 group-hover:rotate-90 transition-transform" /> Reject
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="gap-1 group"
                                  onClick={() => handleUpdateStatus(booking.id, 'accepted')}
                                >
                                  <Check className="h-4 w-4 group-hover:scale-110 transition-transform" /> Accept
                                </Button>
                              </>
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
                  <Badge className={statusColors[selectedBooking.status] || 'bg-muted text-muted-foreground'}>
                    {selectedBooking.status.replace('_', ' ')}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
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
                      <Badge variant="outline" className="text-xs">
                        {selectedBooking.payment_status || 'pending'}
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
                <div className="flex gap-3">
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
                          handleUpdateStatus(selectedBooking.id, 'rejected');
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
                          handleUpdateStatus(selectedBooking.id, 'accepted');
                          setIsDetailOpen(false);
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                    </>
                  )}
                  {selectedBooking.status !== 'requested' && (
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
    </PageTransition>
  );
};

export default OwnerRequests;
