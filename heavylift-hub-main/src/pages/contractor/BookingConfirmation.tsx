import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatNaira } from '@/types';
import { 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Package, 
  CreditCard,
  ArrowRight,
  Home,
  Clock
} from 'lucide-react';
import { PageTransition } from '@/components/ui/animated-container';
import { Skeleton } from '@/components/ui/skeleton';

interface BookingDetails {
  id: string;
  booking_number: string;
  status: string;
  start_date: string;
  end_date: string;
  site_location: string;
  rental_amount: number;
  platform_fee: number;
  vat_amount: number;
  deposit_amount: number | null;
  total_amount: number;
  created_at: string;
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
    company_name: string | null;
  } | null;
}

const BookingConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id || !user) return;

      try {
        const { data: bookingData, error } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_number,
            status,
            start_date,
            end_date,
            site_location,
            rental_amount,
            platform_fee,
            vat_amount,
            deposit_amount,
            total_amount,
            created_at,
            owner_id,
            equipment_id
          `)
          .eq('id', id)
          .eq('contractor_id', user.id)
          .maybeSingle();

        if (error || !bookingData) {
          navigate('/contractor/bookings');
          return;
        }

        // Fetch equipment
        let equipment = null;
        if (bookingData.equipment_id) {
          const { data: equipmentData } = await supabase
            .from('equipment')
            .select('id, title, make, model, images, daily_rate')
            .eq('id', bookingData.equipment_id)
            .maybeSingle();
          equipment = equipmentData;
        }

        // Fetch owner profile
        let ownerProfile = null;
        if (bookingData.owner_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, company_name')
            .eq('id', bookingData.owner_id)
            .maybeSingle();
          ownerProfile = profileData;
        }

        setBooking({
          ...bookingData,
          equipment,
          owner_profile: ownerProfile
        });
      } catch (error) {
        console.error('Error fetching booking:', error);
        navigate('/contractor/bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [id, user, navigate]);

  if (isLoading) {
    return (
      <PageTransition className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </PageTransition>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <PageTransition className="max-w-2xl mx-auto py-12 px-4">
      {/* Success Header */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold mb-2"
        >
          Booking Request Sent!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground"
        >
          Your booking request has been submitted. The owner will review and respond shortly.
        </motion.p>
      </motion.div>

      {/* Booking Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Booking Number & Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Booking Number</p>
                <p className="text-lg font-semibold">#{booking.booking_number}</p>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                <Clock className="h-3 w-3 mr-1" />
                Pending Review
              </Badge>
            </div>

            <Separator />

            {/* Equipment Info */}
            <div className="flex gap-4">
              {booking.equipment?.images?.[0] && (
                <img
                  src={booking.equipment.images[0]}
                  alt={booking.equipment.title}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Equipment</span>
                </div>
                <h3 className="font-semibold text-lg">{booking.equipment?.title || 'Equipment'}</h3>
                <p className="text-sm text-muted-foreground">
                  {booking.equipment?.make} {booking.equipment?.model}
                </p>
                {booking.owner_profile?.full_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Listed by {booking.owner_profile.full_name}
                    {booking.owner_profile.company_name && ` • ${booking.owner_profile.company_name}`}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Rental Period */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Rental Period</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{format(new Date(booking.start_date), 'PPP')}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">{format(new Date(booking.end_date), 'PPP')}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Delivery Location</span>
              </div>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{booking.site_location}</p>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Payment Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rental Amount</span>
                  <span>{formatNaira(booking.rental_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span>{formatNaira(booking.platform_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (7.5%)</span>
                  <span>{formatNaira(booking.vat_amount)}</span>
                </div>
                {booking.deposit_amount && booking.deposit_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security Deposit</span>
                    <span>{formatNaira(booking.deposit_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base pt-2">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatNaira(booking.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">What happens next?</h4>
              <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>The equipment owner will review your request</li>
                <li>You'll receive a notification when they respond</li>
                <li>Once accepted, you can proceed with payment</li>
                <li>Equipment will be delivered to your site on the start date</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 mt-8"
      >
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => navigate('/contractor')}
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={() => navigate('/contractor/bookings')}
        >
          View All Bookings
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </PageTransition>
  );
};

export default BookingConfirmation;
