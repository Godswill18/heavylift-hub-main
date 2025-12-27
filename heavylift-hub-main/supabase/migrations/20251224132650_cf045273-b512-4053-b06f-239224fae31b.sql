-- Create a function to notify owner when booking is created
CREATE OR REPLACE FUNCTION public.notify_owner_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for the equipment owner
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.owner_id,
    'New Booking Request',
    'You have received a new booking request for your equipment. Booking #' || NEW.booking_number,
    'booking',
    '/owner/requests'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire on new booking
CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_owner_on_booking();