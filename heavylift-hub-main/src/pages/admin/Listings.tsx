import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatNaira } from '@/types';
import { Search, Check, X, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Listing {
  id: string;
  title: string;
  category: string;
  daily_rate: number;
  is_active: boolean;
  owner: { full_name: string | null; company_name: string | null } | null;
}

const AdminListings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      // Fetch equipment first
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select(`
          id,
          title,
          category,
          daily_rate,
          is_active,
          owner_id
        `)
        .order('created_at', { ascending: false });

      if (equipmentError) throw equipmentError;

      if (!equipmentData || equipmentData.length === 0) {
        setListings([]);
        setIsLoading(false);
        return;
      }

      // Fetch owner profiles separately
      const ownerIds = [...new Set(equipmentData.map(e => e.owner_id).filter(Boolean))];
      let profileMap = new Map();
      
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, company_name')
          .in('id', ownerIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      }

      const listingsWithOwners = equipmentData.map(e => ({
        ...e,
        owner: e.owner_id ? profileMap.get(e.owner_id) || null : null
      }));

      setListings(listingsWithOwners as Listing[]);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;

      setListings(listings.map(l => 
        l.id === id ? { ...l, is_active: !currentState } : l
      ));
      toast.success(currentState ? 'Listing deactivated' : 'Listing activated');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing');
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchQuery || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return listing.is_active;
    if (activeTab === 'inactive') return !listing.is_active;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Listing Management</h1>
        <p className="text-muted-foreground">Review and manage equipment listings ({listings.length} total)</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search listings..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({listings.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({listings.filter(l => l.is_active).length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactive ({listings.filter(l => !l.is_active).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {filteredListings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No listings found
            </CardContent>
          </Card>
        ) : (
          filteredListings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium">{listing.title}</h3>
                      <Badge variant={listing.is_active ? 'default' : 'secondary'}>
                        {listing.is_active ? 'active' : 'inactive'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{listing.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {listing.owner?.company_name || listing.owner?.full_name || 'Unknown Owner'} • {formatNaira(listing.daily_rate)}/day
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/listings/${listing.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {listing.is_active ? (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleToggleActive(listing.id, listing.is_active)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => handleToggleActive(listing.id, listing.is_active)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminListings;
