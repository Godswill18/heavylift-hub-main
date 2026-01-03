import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/types';
import { AlertTriangle, Eye, Clock, MessageSquare, Image, User, Calendar, FileText, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { PageTransition, StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/ui/animated-container';
import { ListItemSkeleton } from '@/components/ui/loading-skeleton';
import { NoDisputes } from '@/components/ui/empty-state';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Dispute {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  raised_by: string;
  raised_by_role: string;
  created_at: string;
  evidence: string[] | null;
  contractor_response: string | null;
  contractor_response_at: string | null;
  contractor_evidence: string[] | null;
  resolution: string | null;
  resolution_notes: string | null;
  refund_amount: number | null;
  booking_id: string;
  booking: {
    booking_number: string;
    total_amount: number;
    rental_amount: number;
    deposit_amount: number | null;
    start_date: string;
    end_date: string;
    contractor_id: string | null;
    owner_id: string | null;
  } | null;
  raiser_profile?: {
    full_name: string | null;
    email: string | null;
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
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

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
          description,
          status,
          raised_by,
          raised_by_role,
          created_at,
          evidence,
          contractor_response,
          contractor_response_at,
          contractor_evidence,
          resolution,
          resolution_notes,
          refund_amount,
          booking_id,
          booking:booking_id (
            booking_number, 
            total_amount, 
            rental_amount,
            deposit_amount,
            start_date,
            end_date,
            contractor_id,
            owner_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch raiser profiles separately
      const disputesWithProfiles = await Promise.all(
        ((data as unknown as Dispute[]) || []).map(async (dispute) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', dispute.raised_by)
            .maybeSingle();
          return { ...dispute, raiser_profile: profile };
        })
      );

      setDisputes(disputesWithProfiles);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolution(dispute.resolution || '');
    setResolutionNotes(dispute.resolution_notes || '');
    setNewStatus(dispute.status);
    setRefundAmount(dispute.refund_amount?.toString() || '');
    setIsDialogOpen(true);
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (statusFilter === 'all') return true;
    return dispute.status === statusFilter;
  });

  const getStatusCount = (status: string) => {
    if (status === 'all') return disputes.length;
    return disputes.filter(d => d.status === status).length;
  };

  const handleUpdateDispute = async () => {
    if (!selectedDispute) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('disputes')
        .update({
          status: newStatus as 'open' | 'under_review' | 'resolved' | 'closed',
          resolution: resolution || null,
          resolution_notes: resolutionNotes || null,
          refund_amount: refundAmount ? parseFloat(refundAmount) : null,
        })
        .eq('id', selectedDispute.id);

      if (error) throw error;

      toast.success('Dispute updated successfully');
      setIsDialogOpen(false);
      fetchDisputes();
    } catch (error) {
      console.error('Error updating dispute:', error);
      toast.error('Failed to update dispute');
    } finally {
      setIsSubmitting(false);
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

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="gap-1">
            All <Badge variant="secondary" className="ml-1 h-5 px-1.5">{getStatusCount('all')}</Badge>
          </TabsTrigger>
          <TabsTrigger value="open" className="gap-1">
            Open <Badge variant="secondary" className="ml-1 h-5 px-1.5">{getStatusCount('open')}</Badge>
          </TabsTrigger>
          <TabsTrigger value="under_review" className="gap-1">
            Under Review <Badge variant="secondary" className="ml-1 h-5 px-1.5">{getStatusCount('under_review')}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-1">
            Resolved <Badge variant="secondary" className="ml-1 h-5 px-1.5">{getStatusCount('resolved')}</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-1">
            Closed <Badge variant="secondary" className="ml-1 h-5 px-1.5">{getStatusCount('closed')}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      ) : filteredDisputes.length === 0 ? (
        <NoDisputes />
      ) : (
        <StaggerContainer className="space-y-4">
          {filteredDisputes.map((dispute) => {
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
                            {dispute.contractor_response && (
                              <Badge variant="secondary" className="gap-1">
                                <MessageSquare className="h-3 w-3" /> Response
                              </Badge>
                            )}
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
                        <Button className="gap-2 group" onClick={() => handleReview(dispute)}>
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

      {/* Dispute Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Dispute Review
            </DialogTitle>
          </DialogHeader>

          {selectedDispute && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Dispute Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusColors[selectedDispute.status] || statusColors.open}>
                    {selectedDispute.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="capitalize">Raised by: {selectedDispute.raised_by_role}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedDispute.created_at), 'PPP p')}
                  </span>
                </div>

                {/* Booking Info */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Booking Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Booking #:</span>
                        <p className="font-medium">{selectedDispute.booking?.booking_number}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Amount:</span>
                        <p className="font-medium">{formatNaira(selectedDispute.booking?.total_amount || 0)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rental Period:</span>
                        <p className="font-medium">
                          {selectedDispute.booking?.start_date && format(new Date(selectedDispute.booking.start_date), 'PP')} - {selectedDispute.booking?.end_date && format(new Date(selectedDispute.booking.end_date), 'PP')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Deposit:</span>
                        <p className="font-medium">{formatNaira(selectedDispute.booking?.deposit_amount || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Owner's Complaint */}
                <Card className="border-destructive/30">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                      <User className="h-4 w-4" /> {selectedDispute.raised_by_role === 'owner' ? "Owner's" : "Contractor's"} Complaint
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Raised by:</span>
                        <p className="font-medium">{selectedDispute.raiser_profile?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{selectedDispute.raiser_profile?.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Reason:</span>
                        <p className="font-medium">{selectedDispute.reason}</p>
                      </div>
                      {selectedDispute.description && (
                        <div>
                          <span className="text-sm text-muted-foreground">Description:</span>
                          <p className="text-sm mt-1 bg-muted/50 p-3 rounded-md">{selectedDispute.description}</p>
                        </div>
                      )}
                      {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                            <Image className="h-3 w-3" /> Evidence Photos ({selectedDispute.evidence.length})
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {selectedDispute.evidence.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                <img 
                                  src={url} 
                                  alt={`Evidence ${idx + 1}`} 
                                  className="w-full h-24 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Contractor's Response */}
                <Card className="border-primary/30">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                      <MessageSquare className="h-4 w-4" /> Contractor's Response
                    </h3>
                    {selectedDispute.contractor_response ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Responded on: {selectedDispute.contractor_response_at && format(new Date(selectedDispute.contractor_response_at), 'PPP p')}
                        </div>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">{selectedDispute.contractor_response}</p>
                        {selectedDispute.contractor_evidence && selectedDispute.contractor_evidence.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                              <Image className="h-3 w-3" /> Counter Evidence ({selectedDispute.contractor_evidence.length})
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              {selectedDispute.contractor_evidence.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                  <img 
                                    src={url} 
                                    alt={`Counter Evidence ${idx + 1}`} 
                                    className="w-full h-24 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No response yet from the contractor</p>
                    )}
                  </CardContent>
                </Card>

                <Separator />

                {/* Resolution Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Admin Resolution</h3>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Resolution Decision</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="favor_owner">In Favor of Owner</SelectItem>
                        <SelectItem value="favor_contractor">In Favor of Contractor</SelectItem>
                        <SelectItem value="partial_refund">Partial Refund</SelectItem>
                        <SelectItem value="no_action">No Action Required</SelectItem>
                        <SelectItem value="mutual_agreement">Mutual Agreement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Resolution Notes</Label>
                    <Textarea 
                      placeholder="Explain your decision and any actions taken..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Refund Amount (₦)
                    </Label>
                    <Input 
                      type="number"
                      placeholder="Enter refund amount if applicable..."
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      min="0"
                      max={selectedDispute?.booking?.total_amount || undefined}
                    />
                    {selectedDispute?.booking?.total_amount && (
                      <p className="text-xs text-muted-foreground">
                        Max refundable: {formatNaira(selectedDispute.booking.total_amount)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleUpdateDispute} 
                      disabled={isSubmitting}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isSubmitting ? 'Saving...' : 'Save Resolution'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default AdminDisputes;
