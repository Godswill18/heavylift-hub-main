import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/types';
import { AlertTriangle, Eye, Clock } from 'lucide-react';
import { PageTransition, StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/ui/animated-container';
import { ListItemSkeleton } from '@/components/ui/loading-skeleton';
import { NoDisputes } from '@/components/ui/empty-state';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

interface Dispute {
  id: string;
  reason: string;
  status: string;
  raised_by_role: string;
  created_at: string;
  booking: {
    booking_number: string;
    total_amount: number;
  } | null;
}

const statusColors: Record<string, string> = {
  open: 'bg-red-500/10 text-red-600 border-red-500/20',
  under_review: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

const AdminDisputes = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select(`
          id,
          reason,
          status,
          raised_by_role,
          created_at,
          booking:booking_id (booking_number, total_amount)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes((data as unknown as Dispute[]) || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Dispute Resolution</h1>
        <p className="text-muted-foreground">Handle and resolve booking disputes ({disputes.length} total)</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <NoDisputes />
      ) : (
        <StaggerContainer className="space-y-4">
          {disputes.map((dispute) => {
            const daysOpen = differenceInDays(new Date(), new Date(dispute.created_at));
            
            return (
              <StaggerItem key={dispute.id}>
                <ScaleOnHover scale={1.01}>
                  <Card className="border-l-4 border-l-destructive transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 0.5, repeat: 2 }}
                            >
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            </motion.div>
                            <span className="font-mono text-sm">{dispute.id.slice(0, 8).toUpperCase()}</span>
                            <Badge className={statusColors[dispute.status] || statusColors.open}>
                              {dispute.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="capitalize">{dispute.raised_by_role}</Badge>
                          </div>
                          <p className="font-medium">{dispute.reason}</p>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                            <span>Booking: {dispute.booking?.booking_number || 'Unknown'}</span>
                            <span>Amount: {formatNaira(dispute.booking?.total_amount || 0)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{daysOpen} days open
                            </span>
                          </div>
                        </div>
                        <Button className="gap-2 group">
                          <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" /> Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScaleOnHover>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </PageTransition>
  );
};

export default AdminDisputes;
