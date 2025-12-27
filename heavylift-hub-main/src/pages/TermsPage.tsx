import { Badge } from '@/components/ui/badge';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container text-center">
          <Badge variant="outline" className="mb-4">Legal</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container max-w-3xl prose prose-lg dark:prose-invert">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using MachRent's platform and services, you agree to be bound by these 
            Terms of Service and all applicable laws and regulations. If you do not agree with any 
            of these terms, you are prohibited from using or accessing this platform.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            MachRent provides an online marketplace that connects equipment owners with contractors 
            seeking to rent heavy construction equipment. We facilitate the connection between 
            parties but do not own, operate, or maintain any equipment listed on our platform.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            To use certain features of our service, you must register for an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your password and accept all risks of unauthorized access</li>
            <li>Notify us immediately if you discover any unauthorized use of your account</li>
          </ul>

          <h2>4. Equipment Listings</h2>
          <p>
            Equipment owners are responsible for:
          </p>
          <ul>
            <li>Providing accurate descriptions and images of their equipment</li>
            <li>Maintaining equipment in safe, working condition</li>
            <li>Having appropriate insurance coverage for their equipment</li>
            <li>Responding promptly to booking requests</li>
            <li>Honoring confirmed bookings</li>
          </ul>

          <h2>5. Bookings and Payments</h2>
          <p>
            When a contractor books equipment:
          </p>
          <ul>
            <li>Payment is required at the time of booking confirmation</li>
            <li>Funds are held in escrow until the rental period begins</li>
            <li>Owners receive payment after successful completion of the rental</li>
            <li>MachRent charges a 10% platform fee on each transaction</li>
          </ul>

          <h2>6. Cancellation Policy</h2>
          <p>
            Cancellations are subject to the following terms:
          </p>
          <ul>
            <li>Cancellations made 48+ hours before the start date: Full refund</li>
            <li>Cancellations made 24-48 hours before: 50% refund</li>
            <li>Cancellations made less than 24 hours before: No refund</li>
            <li>Owner cancellations may result in penalties and account restrictions</li>
          </ul>

          <h2>7. Disputes</h2>
          <p>
            In case of disputes between users, MachRent provides a resolution process. We may:
          </p>
          <ul>
            <li>Review evidence submitted by both parties</li>
            <li>Make binding decisions regarding refunds or payments</li>
            <li>Suspend or terminate accounts that violate our policies</li>
          </ul>

          <h2>8. Limitation of Liability</h2>
          <p>
            MachRent is not responsible for:
          </p>
          <ul>
            <li>The condition, safety, or legality of equipment listed</li>
            <li>The ability of owners to rent equipment or contractors to pay</li>
            <li>Any damages arising from equipment use or rental transactions</li>
            <li>The conduct of any users, whether online or offline</li>
          </ul>

          <h2>9. Intellectual Property</h2>
          <p>
            The MachRent platform, including its design, features, and content, is owned by MachRent 
            and protected by intellectual property laws. Users may not copy, modify, or distribute 
            any part of our platform without written permission.
          </p>

          <h2>10. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any time for violations of 
            these terms or for any other reason at our discretion. Upon termination, your right to 
            use the platform will immediately cease.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We may revise these terms at any time. By continuing to use our platform after changes 
            become effective, you agree to be bound by the revised terms.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of the 
            Federal Republic of Nigeria, without regard to its conflict of law provisions.
          </p>

          <h2>13. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us at:
          </p>
          <ul>
            <li>Email: legal@machrent.ng</li>
            <li>Address: Victoria Island, Lagos, Nigeria</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
