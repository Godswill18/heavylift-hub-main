import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/types';
import { ArrowLeft, Check, X, MapPin, Calendar, Star, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ListingDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  make: string;
  model: string;
  year: number | null;
  condition: string | null;
  daily_rate: number;
  minimum_days: number | null;
  deposit_amount: number | null;
  location: string;
  city: string | null;
  is_active: boolean;
  is_featured: boolean | null;
  delivery_available: boolean | null;
  delivery_fee: number | null;
  delivery_radius: number | null;
  rating: number | null;
  total_reviews: number | null;
  total_bookings: number | null;
  images: string[] | null;
  created_at: string;
  owner: { 
    id: string;
    full_name: string | null; 
    company_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

const AdminListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [listing, setListing] = useState<ListingDetail | null>(null);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select(`
          id,
          title,
          description,
          category,
          make,
          model,
          year,
          condition,
          daily_rate,
          minimum_days,
          deposit_amount,
          location,
          city,
          is_active,
          is_featured,
          delivery_available,
          delivery_fee,
          delivery_radius,
          rating,
          total_reviews,
          total_bookings,
          images,
          created_at,
          owner_id
        `)
        .eq('id', id)
        .maybeSingle();

      if (equipmentError) throw equipmentError;
      
      if (!equipmentData) {
        toast.error('Listing not found');
        navigate('/admin/listings');
        return;
      }

      let owner = null;
      if (equipmentData.owner_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('id, full_name, company_name, email, phone')
          .eq('id', equipmentData.owner_id)
          .maybeSingle();
        owner = ownerData;
      }

      setListing({ ...equipmentData, owner } as ListingDetail);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!listing) return;
    
    try {
      const { error } = await supabase
        .from('equipment')
        .update({ is_active: !listing.is_active })
        .eq('id', listing.id);

      if (error) throw error;

      setListing({ ...listing, is_active: !listing.is_active });
      toast.success(listing.is_active ? 'Listing deactivated' : 'Listing activated');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing');
    }
  };

  const handleToggleFeatured = async () => {
    if (!listing) return;
    
    try {
      const { error } = await supabase
        .from('equipment')
        .update({ is_featured: !listing.is_featured })
        .eq('id', listing.id);

      if (error) throw error;

      setListing({ ...listing, is_featured: !listing.is_featured });
      toast.success(listing.is_featured ? 'Removed from featured' : 'Added to featured');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing');
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

  if (!listing) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/listings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{listing.title}</h1>
          <p className="text-muted-foreground">Listed {format(new Date(listing.created_at), 'MMM d, yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={listing.is_featured ? 'default' : 'outline'}
            onClick={handleToggleFeatured}
          >
            <Star className={`h-4 w-4 mr-1 ${listing.is_featured ? 'fill-current' : ''}`} />
            {listing.is_featured ? 'Featured' : 'Feature'}
          </Button>
          {listing.is_active ? (
            <Button variant="destructive" onClick={handleToggleActive}>
              <X className="h-4 w-4 mr-1" /> Deactivate
            </Button>
          ) : (
            <Button onClick={handleToggleActive}>
              <Check className="h-4 w-4 mr-1" /> Activate
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant={listing.is_active ? 'default' : 'secondary'}>
          {listing.is_active ? 'Active' : 'Inactive'}
        </Badge>
        <Badge variant="outline" className="capitalize">{listing.category}</Badge>
        {listing.condition && (
          <Badge variant="outline" className="capitalize">{listing.condition.replace('_', ' ')}</Badge>
        )}
        {listing.is_featured && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Featured</Badge>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Make</span>
                <p className="font-medium">{listing.make}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Model</span>
                <p className="font-medium">{listing.model}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Year</span>
                <p className="font-medium">{listing.year || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Condition</span>
                <p className="font-medium capitalize">{listing.condition?.replace('_', ' ') || 'N/A'}</p>
              </div>
            </div>
            
            {listing.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description</span>
                <p className="mt-1">{listing.description}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{listing.location}, {listing.city}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Daily Rate</span>
                <p className="font-medium text-lg">{formatNaira(listing.daily_rate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Minimum Days</span>
                <p className="font-medium">{listing.minimum_days || 1} day(s)</p>
              </div>
              <div>
                <span className="text-muted-foreground">Deposit Amount</span>
                <p className="font-medium">{formatNaira(listing.deposit_amount || 0)}</p>
              </div>
            </div>

            {listing.delivery_available && (
              <div className="flex items-center gap-2 text-sm border-t pt-4">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>Delivery available ({listing.delivery_radius}km radius) - {formatNaira(listing.delivery_fee || 0)}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm border-t pt-4">
              <div className="text-center">
                <span className="text-muted-foreground block">Rating</span>
                <p className="font-medium">{listing.rating || 0} / 5</p>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">Reviews</span>
                <p className="font-medium">{listing.total_reviews || 0}</p>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground block">Bookings</span>
                <p className="font-medium">{listing.total_bookings || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {listing.owner ? (
              <>
                <div>
                  <span className="text-sm text-muted-foreground">Name</span>
                  <p className="font-medium">{listing.owner.full_name || 'N/A'}</p>
                </div>
                {listing.owner.company_name && (
                  <div>
                    <span className="text-sm text-muted-foreground">Company</span>
                    <p className="font-medium">{listing.owner.company_name}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Email</span>
                  <p className="font-medium">{listing.owner.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <p className="font-medium">{listing.owner.phone || 'N/A'}</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/admin/users?id=${listing.owner?.id}`)}
                >
                  View Owner Profile
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Owner information not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images ({listing.images?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {listing.images && listing.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {listing.images.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt={`${listing.title} ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
                <p className="text-muted-foreground">No images uploaded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminListingDetail;
