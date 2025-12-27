-- Create a function to update equipment and owner ratings when a review is added
CREATE OR REPLACE FUNCTION public.update_ratings_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_equipment_rating NUMERIC;
  total_equipment_reviews INTEGER;
  avg_owner_rating NUMERIC;
  total_owner_reviews INTEGER;
BEGIN
  -- Update equipment rating if equipment_id is provided
  IF NEW.equipment_id IS NOT NULL THEN
    SELECT AVG(rating), COUNT(*) INTO avg_equipment_rating, total_equipment_reviews
    FROM reviews
    WHERE equipment_id = NEW.equipment_id;
    
    UPDATE equipment
    SET rating = ROUND(avg_equipment_rating, 1),
        total_reviews = total_equipment_reviews
    WHERE id = NEW.equipment_id;
  END IF;
  
  -- Update owner (reviewee) rating
  SELECT AVG(rating), COUNT(*) INTO avg_owner_rating, total_owner_reviews
  FROM reviews
  WHERE reviewee_id = NEW.reviewee_id;
  
  UPDATE profiles
  SET rating = ROUND(avg_owner_rating, 1),
      total_reviews = total_owner_reviews
  WHERE id = NEW.reviewee_id;
  
  -- Update equipment total_bookings count
  IF NEW.equipment_id IS NOT NULL THEN
    UPDATE equipment
    SET total_bookings = (
      SELECT COUNT(*) FROM bookings 
      WHERE equipment_id = NEW.equipment_id 
      AND status = 'completed'
    )
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire when a review is inserted
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ratings_on_review();