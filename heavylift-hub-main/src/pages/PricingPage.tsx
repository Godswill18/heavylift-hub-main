import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Contractor',
      description: 'For contractors looking to rent equipment',
      price: 'Free',
      period: 'to sign up',
      features: [
        'Browse all available equipment',
        'Request bookings from owners',
        'Secure payment processing',
        'In-app messaging with owners',
        'Booking history & receipts',
        'Customer support',
      ],
      cta: 'Get Started',
      href: '/auth?mode=signup&role=contractor',
      popular: false,
    },
    {
      name: 'Equipment Owner',
      description: 'For owners listing their equipment',
      price: '10%',
      period: 'per transaction',
      features: [
        'Unlimited equipment listings',
        'Set your own rental rates',
        'Manage availability calendar',
        'Accept or decline requests',
        'Secure payment collection',
        'Owner dashboard & analytics',
        'Priority customer support',
      ],
      cta: 'Start Listing',
      href: '/auth?mode=signup&role=owner',
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container text-center">
          <Badge variant="outline" className="mb-4">Simple Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Transparent pricing for everyone
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. Contractors sign up free, and owners only pay when they earn.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate(plan.href)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How does payment work?</h3>
              <p className="text-muted-foreground">
                Contractors pay upfront when booking equipment. Funds are held securely until the rental is completed, then released to the owner minus the platform fee.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What's included in the 10% fee?</h3>
              <p className="text-muted-foreground">
                The fee covers payment processing, platform maintenance, customer support, and dispute resolution services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Are there any hidden fees?</h3>
              <p className="text-muted-foreground">
                No. Contractors pay the listed rental rate plus any delivery fees set by the owner. Owners receive 90% of the rental amount.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel my account?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your account at any time. Any pending bookings must be completed or cancelled first.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
