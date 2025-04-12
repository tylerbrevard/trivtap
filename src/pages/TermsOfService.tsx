
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last Updated: April 12, 2025</p>
        </div>
        
        <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">
          <h2>1. Agreement to Terms</h2>
          <p>
            Welcome to TrivTap. These Terms of Service ("Terms") govern your access to and use of the TrivTap website, mobile application, and other online products and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
          </p>
          
          <h2>2. Privacy Policy</h2>
          <p>
            Please refer to our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> for information about how we collect, use, and share your information.
          </p>
          
          <h2>3. Account Registration and Security</h2>
          <p>
            To use certain features of our Services, you may need to register for an account. When you register, you agree to provide accurate, current, and complete information about yourself and to update this information to keep it accurate, current, and complete. You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access to or use of your account.
          </p>
          
          <h2>4. User Content</h2>
          <p>
            Our Services may allow you to create, upload, post, send, receive, or store content, including trivia questions, answers, text, graphics, audio, video, or other materials (collectively, "User Content"). You retain all rights in and to your User Content, and you grant us a non-exclusive, royalty-free, worldwide, transferable, sublicensable license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display your User Content in any media.
          </p>
          <p>
            You represent and warrant that:
          </p>
          <ul>
            <li>You own or have the necessary rights to use and authorize the use of your User Content as described in these Terms.</li>
            <li>Your User Content does not violate, misappropriate, or infringe the rights of any third party, including intellectual property rights, privacy rights, or publicity rights.</li>
            <li>Your User Content does not contain material that is illegal, defamatory, obscene, pornographic, harassing, threatening, intimidating, abusive, or otherwise objectionable.</li>
          </ul>
          
          <h2>5. Prohibited Conduct</h2>
          <p>
            You agree not to:
          </p>
          <ul>
            <li>Use the Services in any way that violates these Terms or applicable law.</li>
            <li>Use the Services for any illegal or unauthorized purpose.</li>
            <li>Interfere with or disrupt the Services or servers or networks connected to the Services.</li>
            <li>Circumvent, disable, or otherwise interfere with security-related features of the Services.</li>
            <li>Use any robot, spider, crawler, scraper, or other automated means to access or use the Services.</li>
            <li>Impersonate or misrepresent your affiliation with any person or entity.</li>
            <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Services.</li>
            <li>Use the Services to send spam, chain letters, or other unsolicited communications.</li>
            <li>Attempt to access areas of the Services or other accounts, computer systems, or networks not authorized for your access.</li>
            <li>Collect or harvest any information from the Services, including user information.</li>
          </ul>
          
          <h2>6. Intellectual Property Rights</h2>
          <p>
            The Services and their entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio) are owned by TrivTap, its licensors, or other providers of such material and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </p>
          
          <h2>7. Termination</h2>
          <p>
            We may terminate or suspend your access to all or part of the Services, with or without notice, for any conduct that we, in our sole discretion, believe violates these Terms, is harmful to other users of the Services, or violates applicable law.
          </p>
          
          <h2>8. Disclaimer of Warranties</h2>
          <p>
            THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. TRIVTAP DOES NOT GUARANTEE THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
          </p>
          
          <h2>9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TRIVTAP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE SERVICES, WHETHER BASED ON CONTRACT, TORT, OR ANY OTHER LEGAL THEORY, EVEN IF TRIVTAP HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
          
          <h2>10. Governing Law and Jurisdiction</h2>
          <p>
            These Terms and your use of the Services shall be governed by and construed in accordance with the laws of the State of California, without giving effect to any principles of conflicts of law. Any legal action or proceeding arising under these Terms shall be brought exclusively in the federal or state courts located in San Francisco County, California, and you hereby consent to the personal jurisdiction and venue therein.
          </p>
          
          <h2>11. Changes to These Terms</h2>
          <p>
            We may revise these Terms from time to time. If we make material changes to these Terms, we will provide notice to you by posting the updated Terms on our website or through other communications. Your continued use of the Services after the effective date of the revised Terms constitutes your acceptance of them.
          </p>
          
          <h2>12. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
            <br />
            <a href="mailto:terms@trivtap.com" className="text-primary hover:underline">terms@trivtap.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
