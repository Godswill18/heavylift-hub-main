import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatNaira, LAGOS_LOCATIONS, EQUIPMENT_CATEGORIES, type Equipment } from '@/types';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Search,
  MapPin,
  Star,
  Grid3X3,
  List,
  Heart,
  SlidersHorizontal,
} from 'lucide-react';

const EquipmentSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState<string>(searchParams.get('location') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [availableOnly, setAvailableOnly] = useState(true);

  useEffect(() => {
    const loadEquipment = async () => {
      setIsLoading(true);
      
      let query = supabase
        .from('equipment')
        .select('*')
        .eq('is_active', true)
        .gte('daily_rate', priceRange[0])
        .lte('daily_rate', priceRange[1])
        .order('created_at', { ascending: false });
      
      if (selectedCategory && selectedCategory !== '') {
        query = query.eq('category', selectedCategory as any);
      }
      
      if (selectedLocation) {
        query = query.eq('location', selectedLocation);
      }
      
      if (minRating > 0) {
        query = query.gte('rating', minRating);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching equipment:', error);
        setEquipment([]);
      } else {
        // Client-side search filtering
        let filtered = data as Equipment[];
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(e =>
            e.title.toLowerCase().includes(q) ||
            e.make.toLowerCase().includes(q) ||
            e.model.toLowerCase().includes(q)
          );
        }
        setEquipment(filtered);
      }
      
      setIsLoading(false);
    };

    loadEquipment();
  }, [searchQuery, selectedCategory, selectedLocation, priceRange, minRating]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setPriceRange([0, 500000]);
    setMinRating(0);
    setSearchParams({});
  };

  const activeFiltersCount = [
    selectedCategory,
    selectedLocation,
    minRating > 0,
    priceRange[0] > 0 || priceRange[1] < 500000,
  ].filter(Boolean).length;

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Equipment Type</Label>
        <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {EQUIPMENT_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Location</Label>
        <Select value={selectedLocation || "all"} onValueChange={(val) => setSelectedLocation(val === "all" ? "" : val)}>
          <SelectTrigger>
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {LAGOS_LOCATIONS.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Daily Rate: {formatNaira(priceRange[0])} - {formatNaira(priceRange[1])}
        </Label>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          min={0}
          max={500000}
          step={10000}
          className="mt-2"
        />
      </div>

      {/* Rating */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Minimum Rating</Label>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map(rating => (
            <Button
              key={rating}
              variant={minRating === rating ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMinRating(rating)}
              className="flex-1"
            >
              {rating === 0 ? 'Any' : `${rating}+`}
            </Button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="available"
          checked={availableOnly}
          onCheckedChange={(checked) => setAvailableOnly(!!checked)}
        />
        <Label htmlFor="available" className="text-sm cursor-pointer">
          Available only
        </Label>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button variant="ghost" onClick={clearFilters} className="w-full">
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Equipment</h1>
        <p className="text-muted-foreground">
          Find the perfect heavy equipment for your project
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, make, or model..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Mobile Filter Button */}
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FiltersContent />
            </div>
          </SheetContent>
        </Sheet>

        {/* View Toggle */}
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold">Filters</h2>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount}</Badge>
                )}
              </div>
              <FiltersContent />
            </CardContent>
          </Card>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${equipment.length} equipment found`}
            </p>
          </div>

          {/* Equipment Grid/List */}
          {isLoading ? (
            <motion.div 
              className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] animate-pulse" />
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : equipment.length === 0 ? (
            <EmptyState
              title="No equipment found"
              description="Try adjusting your filters or search terms to find what you're looking for."
              icon="search"
              action={{
                label: "Clear Filters",
                onClick: clearFilters
              }}
            />
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {equipment.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    className="group overflow-hidden hover-lift cursor-pointer"
                    onClick={() => navigate(`/equipment/${item.id}`)}
                  >
                    <div className={viewMode === 'list' ? 'flex' : ''}>
                      <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-[4/3]'}`}>
                        <img
                          src={item.images[0] || 'https://images.unsplash.com/photo-1580901368919-7738efb0f87e?w=600&h=400&fit=crop'}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <Badge className="absolute top-3 left-3 bg-background/90 text-foreground capitalize">
                          {item.category}
                        </Badge>
                        {item.is_featured && (
                          <Badge className="absolute top-3 right-3 bg-primary">Featured</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute bottom-3 right-3 bg-background/80 hover:bg-background"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle save/favorite
                          }}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <h3 className="font-semibold mb-2 line-clamp-1">{item.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{item.location}, Lagos</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {item.make}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.condition}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-primary">{formatNaira(item.daily_rate)}</span>
                            <span className="text-sm text-muted-foreground">/day</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{item.rating}</span>
                            <span className="text-muted-foreground text-sm">({item.total_reviews})</span>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentSearchPage;
