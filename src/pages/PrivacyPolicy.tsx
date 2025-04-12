
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2 mb-4">
              <ArrowLeft size={16} />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: April 12, 2025</p>
        </div>
        
        <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">
          <h2>1. Introduction</h2>
          <p>
            Welcome to TrivTap ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, and share information about you when you use our website, mobile application, and other online products and services (collectively, the "Services").
          </p>
          <p>
            By using our Services, you agree to the collection, use, and sharing of your information as described in this Privacy Policy. If you do not agree with our policies and practices, do not use our Services.
          </p>
          
          <h2>2. Information We Collect</h2>
          <p>We collect information in the following ways:</p>
          <h3>Information You Provide to Us</h3>
          <ul>
            <li><strong>Account Information:</strong> When you register for an account, we collect your name, email address, password, and other information you provide.</li>
            <li><strong>Profile Information:</strong> Information you add to your profile, such as a photo, biography, or preferences.</li>
            <li><strong>Content:</strong> Information you provide through our Services, including trivia questions you create, games you host, and messages you send.</li>
            <li><strong>Payment Information:</strong> If you subscribe to our premium services, we collect payment information as necessary to process your payment.</li>
          </ul>
          
          <h3>Information We Collect Automatically</h3>
          <ul>
            <li><strong>Usage Information:</strong> We collect information about your interactions with our Services, such as the pages you visit, the links you click, and the features you use.</li>
            <li><strong>Device Information:</strong> We collect information about the device you use to access our Services, including the hardware model, operating system, unique device identifiers, and mobile network information.</li>
            <li><strong>Location Information:</strong> We may collect information about your location when you use our Services, including precise location data.</li>
            <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar technologies to collect information about your browsing behavior and preferences.</li>
          </ul>
          
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect for various purposes, including to:</p>
          <ul>
            <li>Provide, maintain, and improve our Services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Communicate with you about products, services, offers, and events offered by TrivTap</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
            <li>Detect, prevent, and address technical issues, fraud, or illegal activity</li>
            <li>Personalize the Services and provide recommendations</li>
          </ul>
          
          <h2>4. How We Share Your Information</h2>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li><strong>With Vendors and Service Providers:</strong> We may share your information with vendors and service providers who perform services on our behalf.</li>
            <li><strong>With Business Partners:</strong> We may share your information with our business partners to offer you certain products, services, or promotions.</li>
            <li><strong>For Legal Reasons:</strong> We may share information if we believe it is required by law or to protect the rights, property, and safety of TrivTap or others.</li>
            <li><strong>In Connection with a Business Transaction:</strong> We may share your information in connection with a substantial corporate transaction, such as a merger, consolidation, or sale of our assets.</li>
            <li><strong>With Your Consent:</strong> We may share your information with third parties when you have given us your consent to do so.</li>
          </ul>
          
          <h2>5. Your Rights and Choices</h2>
          <p>You have certain rights and choices regarding your information, including:</p>
          <ul>
            <li><strong>Account Information:</strong> You can update, correct, or delete your account information at any time by logging into your account settings.</li>
            <li><strong>Marketing Communications:</strong> You can opt out of receiving promotional emails from us by following the instructions in those emails.</li>
            <li><strong>Cookies:</strong> Most web browsers allow you to control cookies through their settings. However, if you reject cookies, you may still use our website, but your ability to use some features may be limited.</li>
            <li><strong>Do Not Track:</strong> We currently do not respond to "Do Not Track" signals from web browsers.</li>
          </ul>
          
          <h2>6. Data Security</h2>
          <p>
            We take reasonable measures to help protect your information from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. However, no internet or electronic transmission is ever fully secure or error-free.
          </p>
          
          <h2>7. Children's Privacy</h2>
          <p>
            Our Services are not directed to children under the age of 13. We do not knowingly collect information from children under 13. If you are a parent or guardian and believe that your child has provided us with information, please contact us.
          </p>
          
          <h2>8. Changes to This Privacy Policy</h2>
          <p>
            We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our website or sending you a notification).
          </p>
          
          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: 
            <br />
            <a href="mailto:privacy@trivtap.com" className="text-primary hover:underline">privacy@trivtap.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
