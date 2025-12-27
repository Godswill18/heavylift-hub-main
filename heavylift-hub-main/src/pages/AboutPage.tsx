import { Construction, Users, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AboutPage = () => {
  const values = [
    {
      icon: Shield,
      title: 'Trust & Safety',
      description: 'We verify all users and equipment to ensure secure transactions and reliable rentals.',
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'Building a network of contractors and owners who support each other\'s success.',
    },
    {
      icon: TrendingUp,
      title: 'Growth Together',
      description: 'Helping construction businesses of all sizes access the equipment they need to grow.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Equipment Listed' },
    { value: '1,000+', label: 'Contractors' },
    { value: '200+', label: 'Equipment Owners' },
    { value: '₦50M+', label: 'Transaction Volume' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">About MachRent</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Transforming construction equipment access in Nigeria
            </h1>
            <p className="text-xl text-muted-foreground">
              We're building the largest marketplace for heavy equipment rentals in Lagos, 
              connecting contractors with the machinery they need to build our future.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Construction projects shouldn't stall because of equipment access. We believe every 
                contractor deserves the ability to find and rent quality equipment quickly and affordably.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                At the same time, equipment owners should have a reliable way to put their machinery 
                to work when it's not in use, generating income while helping build Nigeria's infrastructure.
              </p>
              <p className="text-lg text-muted-foreground">
                MachRent bridges this gap with technology, creating a trusted marketplace where 
                both sides can thrive.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-primary/10 flex items-center justify-center">
                <Construction className="h-32 w-32 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <Card key={value.title}>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
          <div className="prose prose-lg mx-auto text-muted-foreground">
            <p>
              MachRent was founded in Lagos, Nigeria by a team passionate about solving real 
              problems in the construction industry. We saw contractors struggling to find 
              equipment, and owners with idle machinery sitting unused.
            </p>
            <p>
              Traditional rental companies often have limited inventory, inflexible terms, and 
              pricing that doesn't work for smaller projects. Meanwhile, equipment owners lacked 
              a reliable way to connect with potential renters.
            </p>
            <p>
              We built MachRent to change this. Our platform makes it easy to list equipment, 
              find what you need, and complete transactions with confidence. With verified users, 
              secure payments, and dedicated support, we're creating a new standard for equipment 
              rental in Nigeria.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
