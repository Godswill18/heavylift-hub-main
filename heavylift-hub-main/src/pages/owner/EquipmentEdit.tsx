import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { EQUIPMENT_CATEGORIES, LAGOS_LOCATIONS } from '@/types';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import EquipmentImageUpload from '@/components/equipment/EquipmentImageUpload';
import type { Database } from '@/integrations/supabase/types';

type EquipmentCategory = Database['public']['Enums']['equipment_category'];

const OwnerEquipmentEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EquipmentCategory | ''>('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [minimumDays, setMinimumDays] = useState('1');
  const [depositAmount, setDepositAmount] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id || !user) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error || !data) {
        console.error('Error fetching equipment:', error);
        toast({ title: 'Error', description: 'Equipment not found or you do not have access.', variant: 'destructive' });
        navigate('/owner/equipment');
        return;
      }

      // Populate form with existing data
      setTitle(data.title);
      setCategory(data.category);
      setMake(data.make);
      setModel(data.model);
      setDescription(data.description || '');
      setDailyRate(data.daily_rate.toString());
      setMinimumDays((data.minimum_days || 1).toString());
      setDepositAmount((data.deposit_amount || 0).toString());
      
      // Extract location without ", Lagos" suffix
      const locationParts = data.location.split(', Lagos');
      setLocation(locationParts[0] || '');
      
      // Handle images - ensure it's an array
      setImages(Array.isArray(data.images) ? data.images : []);
      
      setIsLoading(false);
    };

    fetchEquipment();
  }, [id, user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) {
      toast({ title: 'Error', description: 'You must be logged in to edit equipment.', variant: 'destructive' });
      return;
    }

    if (!category) {
      toast({ title: 'Error', description: 'Please select a category.', variant: 'destructive' });
      return;
    }

    if (!location) {
      toast({ title: 'Error', description: 'Please select a location.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('equipment')
      .update({
        title,
        category: category as EquipmentCategory,
        make,
        model,
        description: description || null,
        daily_rate: parseFloat(dailyRate),
        minimum_days: parseInt(minimumDays) || 1,
        deposit_amount: depositAmount ? parseFloat(depositAmount) : 0,
        location: `${location}, Lagos`,
        images: images.length > 0 ? images : [],
      })
      .eq('id', id)
      .eq('owner_id', user.id);

    setIsSubmitting(false);

    if (error) {
      console.error('Error updating equipment:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update equipment listing.', 
        variant: 'destructive' 
      });
      return;
    }

    toast({ title: 'Equipment Updated!', description: 'Your equipment has been updated successfully.' });
    navigate('/owner/equipment');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Equipment</h1>
          <p className="text-muted-foreground">Update your equipment listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Equipment Title</Label>
                <Input 
                  placeholder="e.g., CAT 320D Hydraulic Excavator" 
                  required 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select required value={category} onValueChange={(val) => setCategory(val as EquipmentCategory)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <Input 
                  placeholder="e.g., Caterpillar" 
                  required 
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input 
                  placeholder="e.g., 320D" 
                  required 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe your equipment..." 
                rows={4} 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Equipment Images</CardTitle></CardHeader>
          <CardContent>
            <EquipmentImageUpload 
              images={images}
              onChange={setImages}
              equipmentId={id}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pricing & Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Daily Rate (₦)</Label>
                <Input 
                  type="number" 
                  placeholder="185000" 
                  required 
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Days</Label>
                <Input 
                  type="number" 
                  placeholder="1" 
                  value={minimumDays}
                  onChange={(e) => setMinimumDays(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Security Deposit (₦)</Label>
                <Input 
                  type="number" 
                  placeholder="500000" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select required value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {LAGOS_LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}, Lagos</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OwnerEquipmentEdit;
