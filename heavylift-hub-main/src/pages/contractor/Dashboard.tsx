import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatNaira } from '@/types';
import { Calendar, Package, Wallet, Search, TrendingUp, Clock, ArrowRight, MapPin } from 'lucide-react';
import { PageTransition, StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/ui/animated-container';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { NoBookings } from '@/components/ui/empty-state';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface DashboardStats {
  activeRentals: number;
  pendingRequests: number;
  totalSpent: number;
  completed: number;
}

interface RecentBooking {
  id: string;
  booking_number: string;
  status: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  site_location: string;
  equipment: {
    title: string;
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
};

const ContractorDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeRentals: 0,
    pendingRequests: 0,
    totalSpent: 0,
    completed: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch bookings for stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, total_amount')
        .eq('contractor_id', user.id);

      if (bookings) {
        const activeRentals = bookings.filter(b => 
          ['on_hire', 'delivering'].includes(b.status || '')
        ).length;
        const pendingRequests = bookings.filter(b => 
          ['requested', 'accepted', 'pending_payment'].includes(b.status || '')
        ).length;
        const completed = bookings.filter(b => b.status === 'completed').length;
        const totalSpent = bookings
          .filter(b => ['on_hire', 'completed'].includes(b.status || ''))
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        setStats({ activeRentals, pendingRequests, totalSpent, completed });
      }

      // Fetch recent bookings with equipment details
      const { data: recent } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_number,
          status,
          total_amount,
          start_date,
          end_date,
          site_location,
          equipment:equipment_id (title)
        `)
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recent) {
        setRecentBookings(recent as unknown as RecentBooking[]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statsDisplay = [
    { label: 'Active Rentals', value: stats.activeRentals.toString(), icon: Package, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Pending Requests', value: stats.pendingRequests.toString(), icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { label: 'Total Spent', value: formatNaira(stats.totalSpent), icon: Wallet, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { label: 'Completed', value: stats.completed.toString(), icon: TrendingUp, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageTransition className="space-y-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name?.split(' ')[0] || 'Contractor'}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your rentals.</p>
      </motion.div>

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsDisplay.map((stat) => (
          <StaggerItem key={stat.label}>
            <ScaleOnHover>
              <Card className="transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <motion.p 
                        className="text-2xl font-bold"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                      >
                        {stat.value}
                      </motion.p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScaleOnHover>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                🚀
              </motion.span>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button onClick={() => navigate('/equipment')} className="gap-2 group">
              <Search className="h-4 w-4" /> Browse Equipment
              <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/contractor/bookings')} className="gap-2">
              <Calendar className="h-4 w-4" /> View Bookings
            </Button>
            <Button variant="outline" onClick={() => navigate('/contractor/wallet')} className="gap-2">
              <Wallet className="h-4 w-4" /> Wallet
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <NoBookings onBrowse={() => navigate('/equipment')} />
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/contractor/bookings`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{booking.equipment?.title || 'Equipment'}</span>
                        <Badge className={statusColors[booking.status || 'requested']}>
                          {(booking.status || 'requested').replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.site_location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold">{formatNaira(booking.total_amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
};

export default ContractorDashboard;
