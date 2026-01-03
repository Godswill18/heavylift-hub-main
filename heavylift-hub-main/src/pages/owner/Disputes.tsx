import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/types';
import { AlertTriangle, Eye, Clock, MessageSquare, Image } from 'lucide-react';
import { PageTransition, StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/ui/animated-container';
import { ListItemSkeleton } from '@/components/ui/loading-skeleton';
import { NoDisputes } from '@/components/ui/empty-state';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Dispute {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  raised_by_role: string;
  created_at: string;
  resolution: string | null;
  resolution_notes: string | null;
  evidence: string[] | null;
  contractor_response: string | null;
  contractor_response_at: string | null;
  contractor_evidence: string[] | null;
  booking: {
    booking_number: string;
    total_amount: number;
    start_date: string;
    end_date: string;
  } | null;
  equipment: {
    title: string;
  } | null;
}

const statusColors: Record<string, string> = {
  open: 'bg-red-500/10 text-red-600 border-red-500/20',
  under_review: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

const OwnerDisputes = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user]);

  const fetchDisputes = async () => {
    if (!user) return;
    
    try {
      // Fetch disputes raised by this owner
      const { data: disputeData, error } = await supabase
        .from('disputes')
        .select(`
          id,
          reason,
          description,
          status,
          raised_by_role,
          created_at,
          resolution,
          resolution_notes,
          evidence,
          contractor_response,
          contractor_response_at,
          contractor_evidence,
          booking_id
        `)
        .eq('raised_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch booking details separately
      const disputesWithDetails: Dispute[] = [];
      
      for (const dispute of disputeData || []) {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('booking_number, total_amount, start_date, end_date, equipment_id')
          .eq('id', dispute.booking_id)
          .maybeSingle();

        let equipmentData = null;
        if (bookingData?.equipment_id) {
          const { data: equipment } = await supabase
            .from('equipment')
            .select('title')
            .eq('id', bookingData.equipment_id)
            .maybeSingle();
          equipmentData = equipment;
        }

        disputesWithDetails.push({
          ...dispute,
          booking: bookingData ? {
            booking_number: bookingData.booking_number,
            total_amount: bookingData.total_amount,
            start_date: bookingData.start_date,
            end_date: bookingData.end_date,
          } : null,
          equipment: equipmentData,
        });
      }

      setDisputes(disputesWithDetails);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setIsDetailOpen(true);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'under_review': return 'Under Review';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  return (
    <PageTransition className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">My Disputes</h1>
        <p className="text-muted-foreground">Track and manage disputes you've raised ({disputes.length} total)</p>
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 0.5, repeat: 2 }}
                            >
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            </motion.div>
                            <span className="font-mono text-sm">{dispute.id.slice(0, 8).toUpperCase()}</span>
                            <Badge className={statusColors[dispute.status] || statusColors.open}>
                              {getStatusLabel(dispute.status)}
                            </Badge>
                          </div>
                          <p className="font-medium">{dispute.reason}</p>
                          {dispute.equipment && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Equipment: {dispute.equipment.title}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm text-muted-foreground mt-2 flex-wrap">
                            <span>Booking: {dispute.booking?.booking_number || 'Unknown'}</span>
                            <span>Amount: {formatNaira(dispute.booking?.total_amount || 0)}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {daysOpen === 0 ? 'Today' : `${daysOpen} days ago`}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="gap-2 group"
                          onClick={() => handleViewDetails(dispute)}
                        >
                          <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
                          View Details
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

      {/* Dispute Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Dispute Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedDispute.status] || statusColors.open}>
                  {getStatusLabel(selectedDispute.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ID: {selectedDispute.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reason</p>
                  <p className="font-medium">{selectedDispute.reason}</p>
                </div>

                {selectedDispute.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{selectedDispute.description}</p>
                  </div>
                )}

                {selectedDispute.equipment && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Equipment</p>
                    <p className="text-sm">{selectedDispute.equipment.title}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booking Number</p>
                    <p className="text-sm font-mono">{selectedDispute.booking?.booking_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booking Amount</p>
                    <p className="text-sm">{formatNaira(selectedDispute.booking?.total_amount || 0)}</p>
                  </div>
                </div>

                {selectedDispute.booking && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rental Period</p>
                    <p className="text-sm">
                      {format(new Date(selectedDispute.booking.start_date), 'MMM d, yyyy')} - {format(new Date(selectedDispute.booking.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Raised On</p>
                  <p className="text-sm">{format(new Date(selectedDispute.created_at), 'PPP')}</p>
                </div>

                {/* Evidence Photos */}
                {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                      <Image className="h-4 w-4" />
                      Evidence Photos ({selectedDispute.evidence.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedDispute.evidence.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                        >
                          <img
                            src={url}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contractor Response */}
                {selectedDispute.contractor_response && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Contractor's Response
                    </p>
                    <p className="text-sm mt-1">{selectedDispute.contractor_response}</p>
                    {selectedDispute.contractor_response_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Responded on {format(new Date(selectedDispute.contractor_response_at), 'PPP')}
                      </p>
                    )}
                    
                    {/* Contractor's Evidence */}
                    {selectedDispute.contractor_evidence && selectedDispute.contractor_evidence.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                          <Image className="h-4 w-4" />
                          Contractor's Evidence ({selectedDispute.contractor_evidence.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedDispute.contractor_evidence.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                            >
                              <img
                                src={url}
                                alt={`Contractor evidence ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedDispute.resolution && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Resolution
                    </p>
                    <p className="text-sm font-medium mt-1">{selectedDispute.resolution}</p>
                    {selectedDispute.resolution_notes && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedDispute.resolution_notes}</p>
                    )}
                  </div>
                )}

                {selectedDispute.status === 'open' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-700">
                      Your dispute is pending review. Our team will contact you with updates.
                    </p>
                  </div>
                )}

                {selectedDispute.status === 'under_review' && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Your dispute is currently being reviewed by our team.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default OwnerDisputes;
