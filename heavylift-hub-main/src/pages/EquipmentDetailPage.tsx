import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatNaira, calculateBookingCosts, type Equipment, type Profile, type Review } from '@/types';
import {
  MapPin,
  Star,
  Calendar as CalendarIcon,
  Check,
  Shield,
  Truck,
  Clock,
  Info,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EquipmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [siteLocation, setSiteLocation] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      
      // Fetch equipment
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (equipmentError || !equipmentData) {
        console.error('Error fetching equipment:', equipmentError);
        setIsLoading(false);
        return;
      }
      
      setEquipment(equipmentData as Equipment);
      
      // Fetch owner profile
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', equipmentData.owner_id)
        .maybeSingle();
      
      if (ownerData) {
        setOwner(ownerData as Profile);
      }
      
      // Fetch reviews for this equipment
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('equipment_id', id)
        .order('created_at', { ascending: false });
      
      if (reviewsData) {
        // Fetch reviewer profiles
        const reviewerIds = reviewsData.map(r => r.reviewer_id);
        const { data: reviewerProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', reviewerIds);
        
        const reviewsWithProfiles = reviewsData.map(review => ({
          ...review,
          reviewer: reviewerProfiles?.find(p => p.id === review.reviewer_id) || null,
        }));
        
        setReviews(reviewsWithProfiles as Review[]);
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [id]);

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to book equipment.',
        variant: 'destructive',
      });
      navigate('/auth?mode=login');
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      toast({
        title: 'Select Dates',
        description: 'Please select your rental dates.',
        variant: 'destructive',
      });
      return;
    }

    if (!siteLocation.trim()) {
      toast({
        title: 'Site Location Required',
        description: 'Please enter the site location.',
        variant: 'destructive',
      });
      return;
    }

    if (!equipment) return;

    setIsBooking(true);

    const bookingCosts = calculateBookingCosts(equipment.daily_rate, days, equipment.deposit_amount);
    
    // Generate a temporary booking number - will be replaced by trigger
    const tempBookingNumber = `BK${Date.now()}`;
    
    const { data: bookingData, error } = await supabase.from('bookings').insert({
      booking_number: tempBookingNumber,
      equipment_id: equipment.id,
      owner_id: equipment.owner_id,
      contractor_id: user.id,
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
      site_location: siteLocation,
      site_address: siteAddress || null,
      special_requirements: specialRequirements || null,
      rental_amount: bookingCosts.rentalAmount,
      platform_fee: bookingCosts.platformFee,
      vat_amount: bookingCosts.vatAmount,
      deposit_amount: equipment.deposit_amount,
      total_amount: bookingCosts.totalAmount,
      status: 'requested',
    }).select('id').single();

    setIsBooking(false);

    if (error || !bookingData) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Booking Failed',
        description: 'Unable to create booking. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Booking Requested!',
      description: 'The owner will review your request shortly.',
    });
    
    navigate(`/contractor/bookings/confirmation/${bookingData.id}`);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-[4/3] rounded-xl" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24" />
          </div>
          <div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Equipment Not Found</h1>
        <Button onClick={() => navigate('/equipment')}>Browse Equipment</Button>
      </div>
    );
  }

  const days = dateRange.from && dateRange.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 0;
  const costs = calculateBookingCosts(equipment.daily_rate, days, equipment.deposit_amount);
  const specs = equipment.specifications as Record<string, string>;

  return (
    <div className="container py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={equipment.images[currentImageIndex]}
                alt={equipment.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Navigation */}
            {equipment.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={() => setCurrentImageIndex(i => i === 0 ? equipment.images.length - 1 : i - 1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={() => setCurrentImageIndex(i => (i + 1) % equipment.images.length)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            
            {/* Thumbnails */}
            <div className="flex gap-2 mt-4">
              {equipment.images.map((img, idx) => (
                <button
                  key={idx}
                  className={cn(
                    "w-20 h-16 rounded-lg overflow-hidden border-2 transition-all",
                    idx === currentImageIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="ghost" size="icon" className="bg-background/80 hover:bg-background">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="bg-background/80 hover:bg-background">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Title & Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className="capitalize">{equipment.category}</Badge>
              <Badge variant="outline" className="capitalize">{equipment.condition}</Badge>
              {equipment.is_featured && <Badge className="bg-primary">Featured</Badge>}
            </div>
            <h1 className="text-3xl font-bold mb-4">{equipment.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{equipment.location}, Lagos</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{equipment.rating}</span>
                <span>({equipment.total_reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-success" />
                <span>{equipment.total_bookings} rentals</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{equipment.description}</p>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Make</p>
                  <p className="font-medium">{equipment.make}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{equipment.model}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-medium">{equipment.year}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">{equipment.capacity}</p>
                </div>
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Owner Card */}
          {owner && (
            <Card>
              <CardHeader>
                <CardTitle>Listed By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={owner.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {owner.full_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{owner.full_name}</h3>
                      {owner.verification_status === 'verified' && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Shield className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {owner.company_name && (
                      <p className="text-sm text-muted-foreground mb-2">{owner.company_name}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-foreground">{owner.rating}</span>
                        <span>({owner.total_reviews} reviews)</span>
                      </div>
                      <span>Member since {format(new Date(owner.created_at || ''), 'MMM yyyy')}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Reviews ({reviews.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-xl font-bold">{equipment.rating}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                      <AvatarFallback>
                        {review.reviewer?.full_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{review.reviewer?.full_name}</h4>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Booking Sidebar */}
        <div className="lg:sticky lg:top-24 space-y-6 h-fit">
          <Card>
            <CardContent className="p-6">
              <div className="mb-6">
                <span className="text-3xl font-bold text-primary">{formatNaira(equipment.daily_rate)}</span>
                <span className="text-muted-foreground">/day</span>
              </div>

              {/* Date Selection */}
              <div className="space-y-4 mb-6">
                <Label className="text-sm font-medium">Rental Period</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                          </>
                        ) : (
                          format(dateRange.from, 'MMM d, yyyy')
                        )
                      ) : (
                        'Select dates'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                      disabled={{ before: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
                
                {equipment.minimum_days > 1 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Minimum rental: {equipment.minimum_days} days
                  </p>
                )}
              </div>

              {/* Cost Breakdown */}
              {days > 0 && (
                <div className="space-y-3 mb-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>{formatNaira(equipment.daily_rate)} × {days} days</span>
                    <span>{formatNaira(costs.rentalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform fee (10%)</span>
                    <span>{formatNaira(costs.platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT (7.5%)</span>
                    <span>{formatNaira(costs.vatAmount)}</span>
                  </div>
                  {equipment.deposit_amount > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Security deposit (refundable)</span>
                      <span>{formatNaira(equipment.deposit_amount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatNaira(costs.totalAmount)}</span>
                  </div>
                </div>
              )}

              {/* Site Location */}
              <div className="space-y-4 mb-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Site Location *</Label>
                  <Input
                    placeholder="e.g., Lekki Phase 1"
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Site Address</Label>
                  <Input
                    placeholder="Full delivery address"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Special Requirements</Label>
                  <Textarea
                    placeholder="Any special requirements or notes..."
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleBooking}
                disabled={days < equipment.minimum_days || isBooking}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : days > 0 ? 'Request Booking' : 'Select Dates'}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                You won't be charged yet. Payment is due after owner approval.
              </p>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {equipment.delivery_available && (
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Delivery available ({equipment.delivery_radius}km radius)</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>Verified owner • Secure payments</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>Usually responds within 24 hours</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetailPage;
