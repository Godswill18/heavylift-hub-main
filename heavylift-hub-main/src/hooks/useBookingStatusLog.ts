import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LogStatusChangeParams {
  bookingId: string;
  previousStatus: string | null;
  newStatus: string;
  actionType: 'status_change' | 'payment_update' | 'cancellation' | 'dispute';
  role: 'contractor' | 'owner' | 'admin' | 'system';
  notes?: string;
}

export function useBookingStatusLog() {
  const { user } = useAuth();

  const logStatusChange = async ({
    bookingId,
    previousStatus,
    newStatus,
    actionType,
    role,
    notes,
  }: LogStatusChangeParams) => {
    if (!user?.id) {
      console.error('Cannot log status change: No authenticated user');
      return { error: new Error('Not authenticated') };
    }

    try {
      const { error } = await supabase
        .from('booking_status_logs')
        .insert({
          booking_id: bookingId,
          previous_status: previousStatus,
          new_status: newStatus,
          action_type: actionType,
          performed_by: user.id,
          performed_by_role: role,
          notes: notes || null,
        });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error logging status change:', error);
      return { error };
    }
  };

  const fetchStatusLogs = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from('booking_status_logs')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching status logs:', error);
      return { data: null, error };
    }
  };

  return {
    logStatusChange,
    fetchStatusLogs,
  };
}
