import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatNaira } from '@/types';
import { Package, Calendar, Wallet, Plus, TrendingUp, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface EquipmentItem {
  id: string;
  title: string;
  daily_rate: number;
  total_bookings: number;
  is_active: boolean;
}

interface BookingRequest {
  id: string;
  booking_number: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  equipment: { title: string } | null;
}

const OwnerDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeRentals: 0,
    pendingRequests: 0,
    equipmentCount: 0,
  });
  const [recentRequests, setRecentRequests] = useState<BookingRequest[]>([]);
  const [topEquipment, setTopEquipment] = useState<EquipmentItem[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      // Fetch equipment count
      const { data: equipment, error: eqError } = await supabase
        .from('equipment')
        .select('id, title, daily_rate, total_bookings, is_active')
        .eq('owner_id', user.id);

      if (eqError) throw eqError;

      // Fetch bookings for this owner
      const { data: bookings, error: bookError } = await supabase
        .from('bookings')
        .select('id, booking_number, start_date, end_date, total_amount, status, owner_payout, equipment(title)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (bookError) throw bookError;

      // Fetch wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, pending_balance, total_earned')
        .eq('user_id', user.id)
        .maybeSingle();

      // Calculate stats
      const activeRentals = bookings?.filter(b => b.status === 'on_hire' || b.status === 'confirmed').length || 0;
      const pendingRequests = bookings?.filter(b => b.status === 'requested').length || 0;
      const totalEarnings = wallet?.total_earned || 0;

      setStats({
        totalEarnings,
        activeRentals,
        pendingRequests,
        equipmentCount: equipment?.length || 0,
      });

      // Recent pending requests
      setRecentRequests(
        (bookings?.filter(b => b.status === 'requested').slice(0, 3) || []) as BookingRequest[]
      );

      // Top equipment by bookings
      setTopEquipment(
        (equipment?.sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0)).slice(0, 3) || []) as EquipmentItem[]
      );

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Earnings', value: formatNaira(stats.totalEarnings), icon: Wallet, color: 'text-emerald-500' },
    { label: 'Active Rentals', value: stats.activeRentals.toString(), icon: Package, color: 'text-primary' },
    { label: 'Pending Requests', value: stats.pendingRequests.toString(), icon: Clock, color: 'text-amber-500' },
    { label: 'Equipment Listed', value: stats.equipmentCount.toString(), icon: TrendingUp, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name?.split(' ')[0] || 'Owner'}!</h1>
          <p className="text-muted-foreground">Manage your equipment and bookings.</p>
        </div>
        <Button onClick={() => navigate('/owner/equipment/new')} className="gap-2">
          <Plus className="h-4 w-4" /> Add Equipment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">{stat.value}</p>
                    )}
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentRequests.length === 0 ? (
              <p className="text-muted-foreground">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{req.equipment?.title || 'Equipment'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Button variant="link" className="px-0 mt-2" onClick={() => navigate('/owner/requests')}>View all requests →</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : topEquipment.length === 0 ? (
              <p className="text-muted-foreground">No equipment listed yet.</p>
            ) : (
              <div className="space-y-3">
                {topEquipment.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{eq.title}</p>
                      <p className="text-xs text-muted-foreground">{formatNaira(eq.daily_rate)}/day</p>
                    </div>
                    <Badge variant="secondary">{eq.total_bookings || 0} bookings</Badge>
                  </div>
                ))}
              </div>
            )}
            <Button variant="link" className="px-0 mt-2" onClick={() => navigate('/owner/equipment')}>View all equipment →</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerDashboard;
