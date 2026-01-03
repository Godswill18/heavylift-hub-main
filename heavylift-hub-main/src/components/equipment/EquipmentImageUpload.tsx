import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  Link, 
  X, 
  Plus, 
  Loader2, 
  Image as ImageIcon,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 6;
const PLACEHOLDER_IMAGE = '/placeholder.svg';

interface EquipmentImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  equipmentId?: string;
  disabled?: boolean;
}

const EquipmentImageUpload = ({ 
  images, 
  onChange, 
  equipmentId,
  disabled = false 
}: EquipmentImageUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadTab, setUploadTab] = useState<'upload' | 'url'>('upload');

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload JPEG, PNG, or WebP images.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 5MB.';
    }
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'Maximum images reached',
        description: `You can only upload up to ${MAX_IMAGES} images.`,
        variant: 'destructive',
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // Validate all files first
    for (const file of filesToUpload) {
      const error = validateFile(file);
      if (error) {
        toast({ title: 'Invalid file', description: error, variant: 'destructive' });
        return;
      }
    }

    setIsUploading(true);
    const newImageUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${equipmentId || 'temp'}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('equipment-images')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('equipment-images')
          .getPublicUrl(filePath);

        newImageUrls.push(publicUrl);
      }

      onChange([...images, ...newImageUrls]);
      toast({
        title: 'Images uploaded',
        description: `${newImageUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) {
      toast({ title: 'Error', description: 'Please enter an image URL.', variant: 'destructive' });
      return;
    }

    if (images.length >= MAX_IMAGES) {
      toast({
        title: 'Maximum images reached',
        description: `You can only have up to ${MAX_IMAGES} images.`,
        variant: 'destructive',
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      toast({ title: 'Invalid URL', description: 'Please enter a valid image URL.', variant: 'destructive' });
      return;
    }

    onChange([...images, urlInput.trim()]);
    setUrlInput('');
    toast({ title: 'Image added', description: 'Image URL added successfully.' });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Equipment Images</Label>
        <span className="text-sm text-muted-foreground">
          {images.length}/{MAX_IMAGES} images
        </span>
      </div>

      {/* Preview Grid */}
      <div className="grid grid-cols-3 gap-3">
        {images.map((img, index) => (
          <div
            key={`${img}-${index}`}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden border bg-muted group",
              index === 0 && "col-span-2 row-span-2"
            )}
          >
            <img
              src={img}
              alt={`Equipment ${index + 1}`}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            {index === 0 && (
              <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                Primary
              </span>
            )}
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {/* Add More Button */}
        {images.length < MAX_IMAGES && !disabled && (
          <Card 
            className={cn(
              "aspect-square flex items-center justify-center cursor-pointer border-dashed hover:border-primary hover:bg-muted/50 transition-colors",
              images.length === 0 && "col-span-2 row-span-2"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center p-4">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground text-center">
                    Add Image
                  </span>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Controls */}
      {!disabled && images.length < MAX_IMAGES && (
        <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'upload' | 'url')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link className="h-4 w-4" />
              Image URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading || disabled}
              />
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Drag and drop or click to upload<br />
                <span className="text-xs">JPEG, PNG, WebP • Max 5MB per file</span>
              </p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || disabled}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={disabled}
              />
              <Button 
                type="button" 
                onClick={handleAddUrl}
                disabled={disabled || !urlInput.trim()}
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter a direct link to an image file
            </p>
          </TabsContent>
        </Tabs>
      )}

      {images.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No images added yet. Add at least one image to showcase your equipment.
        </p>
      )}
    </div>
  );
};

export default EquipmentImageUpload;
