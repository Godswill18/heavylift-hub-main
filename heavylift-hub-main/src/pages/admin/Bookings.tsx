import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/types';
import { Eye, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Booking {
  id: string;
  booking_number: string;
  status: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  equipment: { title: string } | null;
  contractor: { full_name: string | null } | null;
  owner: { full_name: string | null } | null;
}

const statusColors: Record<string, string> = {
  requested: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  accepted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  pending_payment: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  delivering: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  on_hire: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  return_due: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  returned: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  completed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  disputed: 'bg-red-500/10 text-red-600 border-red-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const AdminBookings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      // Fetch bookings first
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_number,
          status,
          total_amount,
          start_date,
          end_date,
          equipment_id,
          contractor_id,
          owner_id
        `)
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
          .select('id, title')
          .in('id', equipmentIds);
        
        equipmentMap = new Map(equipmentData?.map(e => [e.id, e]) || []);
      }

      // Fetch all user profiles separately
      const userIds = [...new Set([
        ...bookingsData.map(b => b.contractor_id),
        ...bookingsData.map(b => b.owner_id)
      ].filter(Boolean))];
      
      let profileMap = new Map();
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      }

      const bookingsWithDetails = bookingsData.map(b => ({
        ...b,
        equipment: b.equipment_id ? equipmentMap.get(b.equipment_id) || null : null,
        contractor: b.contractor_id ? profileMap.get(b.contractor_id) || null : null,
        owner: b.owner_id ? profileMap.get(b.owner_id) || null : null
      }));

      setBookings(bookingsWithDetails as Booking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = activeTab === 'all' 
    ? bookings 
    : bookings.filter(b => {
        if (activeTab === 'active') return ['on_hire', 'return_due', 'delivering', 'confirmed'].includes(b.status);
        if (activeTab === 'pending') return ['requested', 'accepted', 'pending_payment'].includes(b.status);
        if (activeTab === 'completed') return ['completed', 'returned'].includes(b.status);
        if (activeTab === 'disputed') return b.status === 'disputed';
        if (activeTab === 'return_due') return b.status === 'return_due';
        return true;
      });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
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
        <h1 className="text-3xl font-bold mb-2">All Bookings</h1>
        <p className="text-muted-foreground">Monitor and manage platform bookings ({bookings.length} total)</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({bookings.filter(b => ['on_hire', 'return_due', 'delivering', 'confirmed'].includes(b.status)).length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({bookings.filter(b => ['requested', 'accepted', 'pending_payment'].includes(b.status)).length})
          </TabsTrigger>
          <TabsTrigger value="return_due" className="text-rose-600">
            Return Due ({bookings.filter(b => b.status === 'return_due').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({bookings.filter(b => ['completed', 'returned'].includes(b.status)).length})
          </TabsTrigger>
          <TabsTrigger value="disputed">
            Disputed ({bookings.filter(b => b.status === 'disputed').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No bookings found
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-sm">{booking.booking_number}</span>
                      <Badge className={statusColors[booking.status] || statusColors.requested}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h3 className="font-medium">{booking.equipment?.title || 'Equipment'}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                      <span>Contractor: {booking.contractor?.full_name || 'Unknown'}</span>
                      <span>Owner: {booking.owner?.full_name || 'Unknown'}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatNaira(booking.total_amount)}</span>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                      <Eye className="h-4 w-4 mr-1" /> Details
                    </Button>
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

export default AdminBookings;
