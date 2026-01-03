import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNaira } from '@/types';
import { Users, Package, Calendar, DollarSign, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageTransition, StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/ui/animated-container';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  contractors: number;
  owners: number;
  equipmentListed: number;
  activeEquipment: number;
  activeBookings: number;
  pendingPayments: number;
  monthlyRevenue: number;
  openDisputes: number;
  highPriorityDisputes: number;
  pendingVerifications: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'equipment' | 'dispute';
  message: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    contractors: 0,
    owners: 0,
    equipmentListed: 0,
    activeEquipment: 0,
    activeBookings: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    openDisputes: 0,
    highPriorityDisputes: 0,
    pendingVerifications: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role');
      
      const contractors = roles?.filter(r => r.role === 'contractor').length || 0;
      const owners = roles?.filter(r => r.role === 'owner').length || 0;

      // Fetch equipment
      const { data: equipment } = await supabase
        .from('equipment')
        .select('is_active');
      
      const activeEquipment = equipment?.filter(e => e.is_active).length || 0;

      // Fetch bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, total_amount, platform_fee, created_at');
      
      const activeBookings = bookings?.filter(b => 
        ['on_hire', 'return_due', 'delivering', 'confirmed'].includes(b.status || '')
      ).length || 0;
      const pendingPayments = bookings?.filter(b => b.status === 'pending_payment').length || 0;
      
      // Calculate monthly revenue (platform fees from completed/active bookings this month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const monthlyRevenue = bookings
        ?.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate >= startOfMonth && ['on_hire', 'completed', 'confirmed'].includes(b.status || '');
        })
        .reduce((sum, b) => sum + (b.platform_fee || 0), 0) || 0;

      // Fetch disputes
      const { data: disputes } = await supabase
        .from('disputes')
        .select('status');
      
      const openDisputes = disputes?.filter(d => d.status === 'open' || d.status === 'under_review').length || 0;

      // Fetch pending verifications
      const { data: profiles } = await supabase
        .from('profiles')
        .select('verification_status');
      
      const pendingVerifications = profiles?.filter(p => p.verification_status === 'pending').length || 0;

      setStats({
        totalUsers: contractors + owners,
        contractors,
        owners,
        equipmentListed: equipment?.length || 0,
        activeEquipment,
        activeBookings,
        pendingPayments,
        monthlyRevenue,
        openDisputes,
        highPriorityDisputes: disputes?.filter(d => d.status === 'open').length || 0,
        pendingVerifications,
      });

      // Build recent activity from bookings
      const recentBookings = bookings?.slice(0, 4).map((b, i) => ({
        id: `booking-${i}`,
        type: 'booking' as const,
        message: `Booking ${b.status?.replace('_', ' ')} - ${formatNaira(b.total_amount)}`,
        created_at: b.created_at,
      })) || [];

      setRecentActivity(recentBookings);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statsDisplay = [
    { 
      label: 'Total Users', 
      value: stats.totalUsers.toLocaleString(), 
      icon: Users, 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-500/10', 
      sub: `Contractors: ${stats.contractors} | Owners: ${stats.owners}`,
    },
    { 
      label: 'Equipment Listed', 
      value: stats.equipmentListed.toString(), 
      icon: Package, 
      color: 'text-primary', 
      bgColor: 'bg-primary/10', 
      sub: `Active: ${stats.activeEquipment}`,
    },
    { 
      label: 'Active Bookings', 
      value: stats.activeBookings.toString(), 
      icon: Calendar, 
      color: 'text-emerald-500', 
      bgColor: 'bg-emerald-500/10', 
      sub: `${stats.pendingPayments} awaiting payment`,
    },
    { 
      label: 'Monthly Revenue', 
      value: formatNaira(stats.monthlyRevenue), 
      icon: DollarSign, 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-500/10', 
      sub: 'Platform fees this month',
    },
    { 
      label: 'Open Disputes', 
      value: stats.openDisputes.toString(), 
      icon: AlertTriangle, 
      color: 'text-destructive', 
      bgColor: 'bg-destructive/10', 
      sub: `${stats.highPriorityDisputes} high priority`,
    },
    { 
      label: 'Pending Verifications', 
      value: stats.pendingVerifications.toString(), 
      icon: TrendingUp, 
      color: 'text-purple-500', 
      bgColor: 'bg-purple-500/10', 
      sub: 'Users awaiting verification',
    },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageTransition className="space-y-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
      </motion.div>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsDisplay.map((stat) => (
          <StaggerItem key={stat.label}>
            <ScaleOnHover>
              <Card className="transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <motion.p 
                        className="text-2xl font-bold mt-1"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                      >
                        {stat.value}
                      </motion.p>
                      <span className="text-xs text-muted-foreground">{stat.sub}</span>
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

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No recent activity</p>
                ) : (
                  recentActivity.map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      className="flex items-center gap-3 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                    >
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-muted-foreground">{activity.message}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center">
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-3xl font-bold text-primary">{formatNaira(stats.monthlyRevenue)}</p>
                  <p className="text-sm text-muted-foreground">This month's revenue</p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
