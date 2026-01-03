import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNaira } from '@/types';
import { AlertTriangle, Eye, Clock, MessageSquare, Send, Image, Upload, Trash2 } from 'lucide-react';
import { PageTransition, StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/ui/animated-container';
import { ListItemSkeleton } from '@/components/ui/loading-skeleton';
import { NoDisputes } from '@/components/ui/empty-state';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays, format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
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
  contractor_response: string | null;
  contractor_response_at: string | null;
  contractor_evidence: string[] | null;
  evidence: string[] | null;
  booking: {
    booking_number: string;
    total_amount: number;
    start_date: string;
    end_date: string;
  } | null;
  equipment: {
    title: string;
  } | null;
  owner: {
    full_name: string | null;
  } | null;
}

const statusColors: Record<string, string> = {
  open: 'bg-red-500/10 text-red-600 border-red-500/20',
  under_review: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

const ContractorDisputes = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user]);

  const fetchDisputes = async () => {
    if (!user) return;
    
    try {
      // Fetch bookings where user is contractor
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, booking_number, total_amount, start_date, end_date, equipment_id, owner_id')
        .eq('contractor_id', user.id);

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) {
        setDisputes([]);
        setIsLoading(false);
        return;
      }

      const bookingIds = bookings.map(b => b.id);

      // Fetch disputes for these bookings
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
          contractor_response,
          contractor_response_at,
          contractor_evidence,
          evidence,
          booking_id
        `)
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Merge with booking details
      const disputesWithDetails: Dispute[] = [];
      
      for (const dispute of disputeData || []) {
        const booking = bookings.find(b => b.id === dispute.booking_id);
        
        let equipmentData = null;
        if (booking?.equipment_id) {
          const { data: equipment } = await supabase
            .from('equipment')
            .select('title')
            .eq('id', booking.equipment_id)
            .maybeSingle();
          equipmentData = equipment;
        }

        let ownerData = null;
        if (booking?.owner_id) {
          const { data: owner } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', booking.owner_id)
            .maybeSingle();
          ownerData = owner;
        }

        disputesWithDetails.push({
          ...dispute,
          booking: booking ? {
            booking_number: booking.booking_number,
            total_amount: booking.total_amount,
            start_date: booking.start_date,
            end_date: booking.end_date,
          } : null,
          equipment: equipmentData,
          owner: ownerData,
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
    setResponse(dispute.contractor_response || '');
    setEvidenceFiles([]);
    setEvidencePreviews([]);
    setIsDetailOpen(true);
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + evidenceFiles.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setEvidenceFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEvidencePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    setEvidencePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadEvidenceFiles = async (): Promise<string[]> => {
    if (!user || evidenceFiles.length === 0) return [];

    const urls: string[] = [];
    for (const file of evidenceFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('dispute-evidence')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('dispute-evidence')
        .getPublicUrl(fileName);

      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmitResponse = async () => {
    if (!selectedDispute || !response.trim()) return;

    setIsSubmitting(true);
    try {
      // Upload evidence files first
      const evidenceUrls = await uploadEvidenceFiles();

      const { error } = await supabase
        .from('disputes')
        .update({
          contractor_response: response.trim(),
          contractor_response_at: new Date().toISOString(),
          contractor_evidence: evidenceUrls.length > 0 ? evidenceUrls : null,
        })
        .eq('id', selectedDispute.id);

      if (error) throw error;

      toast.success('Response submitted successfully');
      setSelectedDispute({
        ...selectedDispute,
        contractor_response: response.trim(),
        contractor_response_at: new Date().toISOString(),
        contractor_evidence: evidenceUrls.length > 0 ? evidenceUrls : null,
      });
      setEvidenceFiles([]);
      setEvidencePreviews([]);
      fetchDisputes();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="text-3xl font-bold mb-2">Disputes</h1>
        <p className="text-muted-foreground">View and respond to disputes raised against your bookings ({disputes.length} total)</p>
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
                            {dispute.contractor_response && (
                              <Badge variant="outline" className="gap-1">
                                <MessageSquare className="h-3 w-3" />
                                Responded
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{dispute.reason}</p>
                          {dispute.equipment && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Equipment: {dispute.equipment.title}
                            </p>
                          )}
                          {dispute.owner && (
                            <p className="text-sm text-muted-foreground">
                              Raised by: {dispute.owner.full_name || 'Owner'}
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
                          View & Respond
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

                {selectedDispute.owner && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Raised By</p>
                    <p className="text-sm">{selectedDispute.owner.full_name || 'Owner'}</p>
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

                {/* Contractor Response Section */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Your Response</p>
                  
                  {selectedDispute.contractor_response ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-sm">{selectedDispute.contractor_response}</p>
                        {selectedDispute.contractor_response_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Submitted on {format(new Date(selectedDispute.contractor_response_at), 'PPP')}
                          </p>
                        )}
                      </div>
                      
                      {/* Show contractor's uploaded evidence */}
                      {selectedDispute.contractor_evidence && selectedDispute.contractor_evidence.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                            <Image className="h-4 w-4" />
                            Your Evidence ({selectedDispute.contractor_evidence.length})
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
                                  alt={`Your evidence ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : selectedDispute.status === 'open' || selectedDispute.status === 'under_review' ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Explain your side of the story..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        rows={4}
                      />

                      {/* Evidence Upload */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Upload Evidence (Optional, max 5 photos)
                        </p>
                        
                        {evidencePreviews.length > 0 && (
                          <div className="grid grid-cols-5 gap-2 mb-3">
                            {evidencePreviews.map((preview, index) => (
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                                <img src={preview} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeEvidence(index)}
                                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {evidenceFiles.length < 5 && (
                          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Click to upload photos
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleEvidenceUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      <Button 
                        onClick={handleSubmitResponse}
                        disabled={!response.trim() || isSubmitting}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {isSubmitting ? 'Submitting...' : 'Submit Response'}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      This dispute has been {selectedDispute.status} without a response.
                    </p>
                  )}
                </div>

                {selectedDispute.status === 'open' && !selectedDispute.contractor_response && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-700">
                      Please respond to this dispute to share your perspective. This will help our team resolve the issue fairly.
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

export default ContractorDisputes;
