import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ExcavatorScene from '@/components/three/ExcavatorScene';
import { 
  Search, 
  MapPin, 
  Calendar,
  Shield,
  Clock,
  Users,
  ArrowRight,
  Star,
  CheckCircle2,
  Truck,
  CreditCard,
  Headphones,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatNaira, LAGOS_LOCATIONS, EQUIPMENT_CATEGORIES, type Equipment } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredEquipment, setFeaturedEquipment] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedEquipment = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('id, title, category, location, daily_rate, rating, total_reviews, images')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error fetching equipment:', error);
        setFeaturedEquipment([]);
      } else {
        setFeaturedEquipment(data || []);
      }
      setIsLoading(false);
    };

    loadFeaturedEquipment();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/equipment?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-hero" />
        
        {/* 3D Scene */}
        {/* <div className="absolute right-0 top-0 w-full lg:w-1/2 h-full opacity-80 lg:opacity-100">
          <ExcavatorScene className="w-full h-full" />
        </div> */}
        
        {/* Content */}
        <div className="container relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                🇳🇬 Lagos' #1 Equipment Marketplace
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Rent Heavy Equipment{' '}
                <span className="text-gradient-primary">Without the Hassle</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
                Connect with verified equipment owners across Lagos. From excavators to cranes, 
                find the machinery you need for your next project.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-8">
                <div className="flex flex-col sm:flex-row gap-3 p-3 bg-card rounded-xl border border-border shadow-lg">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search equipment (e.g., excavator, crane...)"
                      className="pl-10 border-0 bg-transparent focus-visible:ring-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="lg" className="gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                </div>
              </form>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="gap-2 text-base"
                  onClick={() => navigate('/equipment')}
                >
                  Rent Equipment
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 text-base"
                  onClick={() => navigate('/auth?mode=signup&role=owner')}
                >
                  List Your Equipment
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 500, suffix: '+', label: 'Equipment Listed' },
              { value: 2500, suffix: '+', label: 'Successful Rentals' },
              { value: 1200, suffix: '+', label: 'Happy Customers' },
              { value: 98, suffix: '%', label: 'Satisfaction Rate' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm md:text-base opacity-90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Equipment */}
      <section className="py-20">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Equipment</h2>
              <p className="text-muted-foreground">Top-rated machinery available for rent</p>
            </div>
            <Button variant="ghost" className="gap-2 mt-4 md:mt-0" onClick={() => navigate('/equipment')}>
              View All Equipment
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <Card key={n} className="overflow-hidden">
                  <div className="aspect-[4/3] bg-muted animate-pulse" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                    <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredEquipment.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Truck className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Equipment Listed Yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to list your equipment and start earning!
              </p>
              <Button onClick={() => navigate('/auth?mode=signup&role=owner')} className="gap-2">
                List Your Equipment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEquipment.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    className="group overflow-hidden hover-lift cursor-pointer"
                    onClick={() => navigate(`/equipment/${item.id}`)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1580901368919-7738efb0f87e?w=600&h=400&fit=crop'}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <Badge className="absolute top-3 left-3 bg-background/90 text-foreground capitalize">
                        {item.category}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{item.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{item.location}, Lagos</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-primary">{formatNaira(item.daily_rate)}</span>
                          <span className="text-sm text-muted-foreground">/day</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{item.rating || 0}</span>
                          <span className="text-muted-foreground">({item.total_reviews || 0})</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes. Our platform makes renting heavy equipment simple and secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Search & Browse',
                description: 'Find the perfect equipment from our extensive catalog. Filter by type, location, and availability.',
              },
              {
                step: '02',
                icon: Calendar,
                title: 'Book & Pay',
                description: 'Select your rental dates and submit a booking request. Secure payment through our escrow system.',
              },
              {
                step: '03',
                icon: Truck,
                title: 'Receive & Use',
                description: 'Equipment is delivered to your site or ready for pickup. Our team ensures smooth handover.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <Card className="relative p-6 h-full glass-card border-border/50">
                  <span className="absolute top-4 right-4 text-6xl font-bold text-primary/10">
                    {item.step}
                  </span>
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate('/how-it-works')}>
              Learn More
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose MachRent?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're committed to making equipment rental safe, reliable, and hassle-free.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Verified Users',
                description: 'All owners and contractors undergo thorough verification',
              },
              {
                icon: CreditCard,
                title: 'Secure Payments',
                description: 'Funds held in escrow until rental is complete',
              },
              {
                icon: Clock,
                title: '24/7 Support',
                description: 'Our team is always available to help you',
              },
              {
                icon: CheckCircle2,
                title: 'Quality Guaranteed',
                description: 'All equipment inspected for safety and condition',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg opacity-90">
                Join thousands of contractors and equipment owners on Lagos' most trusted rental platform.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                variant="default" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={() => navigate('/auth?mode=signup&role=contractor')}
              >
                Sign Up as Contractor
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10 gap-2"
                onClick={() => navigate('/auth?mode=signup&role=owner')}
              >
                List Your Equipment
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
