import { Badge } from '@/components/ui/badge';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container text-center">
          <Badge variant="outline" className="mb-4">Legal</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container max-w-3xl prose prose-lg dark:prose-invert">
          <h2>1. Introduction</h2>
          <p>
            MachRent ("we," "our," or "us") is committed to protecting your privacy. This Privacy 
            Policy explains how we collect, use, disclose, and safeguard your information when you 
            use our platform and services.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>We may collect personal information that you voluntarily provide, including:</p>
          <ul>
            <li>Name and contact information (email, phone number, address)</li>
            <li>Account credentials (username and password)</li>
            <li>Company information (for business accounts)</li>
            <li>Government-issued ID (for verification purposes)</li>
            <li>Payment information (processed by secure third-party providers)</li>
            <li>Profile information and photographs</li>
          </ul>

          <h3>Usage Information</h3>
          <p>We automatically collect certain information when you use our platform:</p>
          <ul>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Location data (with your consent)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Create and manage your account</li>
            <li>Process transactions and send related information</li>
            <li>Verify user identity and prevent fraud</li>
            <li>Facilitate communication between users</li>
            <li>Provide customer support</li>
            <li>Send promotional communications (with your consent)</li>
            <li>Improve our platform and develop new features</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. Information Sharing</h2>
          <p>We may share your information with:</p>
          <ul>
            <li>
              <strong>Other users:</strong> Your profile information and listing details are visible 
              to other users as necessary to facilitate transactions
            </li>
            <li>
              <strong>Service providers:</strong> Third-party companies that perform services on 
              our behalf (payment processing, hosting, analytics)
            </li>
            <li>
              <strong>Legal requirements:</strong> When required by law or to protect our rights
            </li>
            <li>
              <strong>Business transfers:</strong> In connection with a merger, acquisition, or 
              sale of assets
            </li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal 
            information, including:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure access controls and authentication</li>
            <li>Regular security assessments and updates</li>
            <li>Employee training on data protection</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed 
            to provide you services. We may retain certain information for longer periods as 
            required by law or for legitimate business purposes.
          </p>

          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing</li>
            <li>Request data portability</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>

          <h2>8. Cookies</h2>
          <p>
            We use cookies and similar technologies to enhance your experience, analyze usage, 
            and deliver personalized content. You can control cookies through your browser settings, 
            but some features may not function properly if cookies are disabled.
          </p>

          <h2>9. Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites. We are not responsible for 
            the privacy practices of these external sites. We encourage you to review their 
            privacy policies.
          </p>

          <h2>10. Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under 18 years of age. We do not 
            knowingly collect personal information from children.
          </p>

          <h2>11. International Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than Nigeria. 
            We ensure appropriate safeguards are in place to protect your information in 
            accordance with this Privacy Policy.
          </p>

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any 
            material changes by posting the new policy on our platform and updating the 
            "Last updated" date.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <ul>
            <li>Email: privacy@machrent.ng</li>
            <li>Address: Victoria Island, Lagos, Nigeria</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
