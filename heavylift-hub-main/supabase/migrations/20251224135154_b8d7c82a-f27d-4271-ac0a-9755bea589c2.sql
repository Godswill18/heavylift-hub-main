-- Create function to notify contractor on booking status change
CREATE OR REPLACE FUNCTION public.notify_contractor_on_booking_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only notify if status changed to accepted or rejected
  IF (OLD.status = 'requested' AND NEW.status IN ('accepted', 'rejected')) THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.contractor_id,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Booking Accepted!'
        ELSE 'Booking Declined'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Great news! Your booking request #' || NEW.booking_number || ' has been accepted. Please proceed with payment to confirm.'
        ELSE 'Unfortunately, your booking request #' || NEW.booking_number || ' was declined by the owner.'
      END,
      'booking',
      '/contractor/bookings'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for contractor notification
DROP TRIGGER IF EXISTS on_booking_status_update ON public.bookings;
CREATE TRIGGER on_booking_status_update
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_contractor_on_booking_update();