import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Star,
  Package,
  Users,
  Shield,
  ArrowRight,
  HardHat,
  Building2,
} from 'lucide-react';

const HowItWorksPage = () => {
  const navigate = useNavigate();

  const contractorSteps = [
    {
      icon: Search,
      title: 'Browse & Search',
      description: 'Explore our extensive catalog of verified heavy equipment. Filter by type, location, price, and availability to find exactly what you need.',
    },
    {
      icon: Calendar,
      title: 'Request Booking',
      description: 'Select your rental dates, enter your project location, and submit a booking request. The equipment owner will review and respond within 24 hours.',
    },
    {
      icon: CreditCard,
      title: 'Secure Payment',
      description: 'Once approved, make payment through our secure escrow system. Funds are held safely until the rental is complete.',
    },
    {
      icon: Truck,
      title: 'Receive Equipment',
      description: 'Equipment is delivered to your site or ready for pickup. Complete the handover checklist to confirm delivery.',
    },
    {
      icon: CheckCircle2,
      title: 'Complete & Review',
      description: 'After your rental period, return the equipment and leave a review. Funds are released to the owner once confirmed.',
    },
  ];

  const ownerSteps = [
    {
      icon: Package,
      title: 'List Your Equipment',
      description: 'Create detailed listings with photos, specifications, pricing, and availability. Highlight features that make your equipment stand out.',
    },
    {
      icon: Users,
      title: 'Receive Requests',
      description: 'Get booking requests from verified contractors. Review their profile, project details, and decide whether to accept.',
    },
    {
      icon: Shield,
      title: 'Secure Transaction',
      description: 'Payment is held in escrow, protecting both parties. You get paid only after successful equipment handover.',
    },
    {
      icon: Truck,
      title: 'Deliver or Arrange Pickup',
      description: 'Coordinate delivery or pickup with the contractor. Complete the handover checklist and upload photos for documentation.',
    },
    {
      icon: Star,
      title: 'Get Paid & Build Reputation',
      description: 'Receive payment after rental completion. Build your reputation with positive reviews to attract more bookings.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How MachRent Works
            </h1>
            <p className="text-xl text-muted-foreground">
              Whether you're a contractor looking to rent equipment or an owner wanting to list your machinery, 
              our platform makes it simple, secure, and hassle-free.
            </p>
          </motion.div>
        </div>
      </section>

      {/* For Contractors */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <HardHat className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">For Contractors</h2>
              <p className="text-muted-foreground">Find and rent the equipment you need</p>
            </div>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-border hidden md:block" />
            
            <div className="space-y-8">
              {contractorSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-6"
                >
                  <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <Card className="flex-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-primary">Step {index + 1}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" onClick={() => navigate('/equipment')} className="gap-2">
              Browse Equipment
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* For Owners */}
      <section id="owners" className="py-20 bg-muted/30">
        <div className="container">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">For Equipment Owners</h2>
              <p className="text-muted-foreground">List your equipment and start earning</p>
            </div>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-border hidden md:block" />
            
            <div className="space-y-8">
              {ownerSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-6"
                >
                  <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <Card className="flex-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-secondary">Step {index + 1}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth?mode=signup&role=owner')} className="gap-2">
              Start Listing
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of contractors and equipment owners on Lagos' most trusted rental platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  Create Free Account
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => navigate('/equipment')}
                >
                  Browse Equipment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
