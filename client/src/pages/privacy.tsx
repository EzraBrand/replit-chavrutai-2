import { Link } from "wouter";
import { Footer } from "@/components/footer";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { getBaseUrl } from "@/lib/utils";

export default function Privacy() {
  const baseUrl = getBaseUrl();
  // Set up SEO
  useSEO({
    title: "Privacy Policy - ChavrutAI Talmud Study Platform",
    description: "Privacy policy for ChavrutAI - learn how we handle your data when using our free Talmud study platform.",
    ogTitle: "Privacy Policy - ChavrutAI",
    ogDescription: "Privacy policy for ChavrutAI - learn how we handle your data when using our free Talmud study platform.",
    ogUrl: `${baseUrl}/privacy`,
    canonical: `${baseUrl}/privacy`,
    robots: "index, follow"
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Centered Logo Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link 
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
              data-testid="header-logo-link"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/hebrew-book-icon.png" 
                  alt="ChavrutAI Logo" 
                  className="w-10 h-10 object-cover"
                />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>
            
            <div className="prose prose-sepia max-w-none">
              <p className="text-sm text-muted-foreground mb-6">
                <strong>Last updated:</strong> September 15, 2025
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Overview</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  ChavrutAI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our free Talmud study platform at chavrutai.com (the "Service").
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  ChavrutAI is a free educational platform designed to make Talmud study accessible through digital technology. We are committed to maintaining your privacy while providing the best possible learning experience.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Information We Collect</h2>
                
                <h3 className="text-lg font-medium text-foreground mb-3">Information You Provide</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
                  <li><strong>Contact Information:</strong> When you contact us via email (ezra@chavrutai.com), we collect your email address and any information you choose to provide in your message.</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mb-3">Information Collected Automatically</h3>
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
                  <li><strong>Usage Analytics:</strong> We use Google Analytics to understand how users interact with our platform, including pages visited, time spent on pages, and general usage patterns.</li>
                  <li><strong>Technical Information:</strong> We may collect standard web server logs including IP addresses, browser types, device information, and referring websites.</li>
                  <li><strong>Study Preferences:</strong> Your text size preferences, font selections, and display settings are stored locally on your device to enhance your study experience.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
                  <li><strong>Provide and Improve Our Service:</strong> To deliver Talmud study content and improve platform functionality</li>
                  <li><strong>Analytics and Research:</strong> To understand usage patterns and improve the educational experience</li>
                  <li><strong>Communication:</strong> To respond to your inquiries and provide support</li>
                  <li><strong>Technical Operations:</strong> To maintain platform security, prevent abuse, and ensure proper functionality</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Information Sharing and Disclosure</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share information in the following limited circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
                  <li><strong>Service Providers:</strong> We use Google Analytics to analyze platform usage. Google's privacy policy governs their data handling practices.</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights, safety, or the rights of others.</li>
                  <li><strong>Text Content:</strong> Talmud text content is sourced from Sefaria.org's public API. We do not share user data with Sefaria.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Data Storage and Security</h2>
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
                  <li><strong>Local Storage:</strong> Study preferences (text size, font, display settings) are stored locally on your device and do not leave your browser.</li>
                  <li><strong>No Account Required:</strong> ChavrutAI does not require user accounts or personal information to access Talmud content.</li>
                  <li><strong>Security Measures:</strong> We implement appropriate technical measures to protect information from unauthorized access, alteration, or destruction.</li>
                  <li><strong>Data Retention:</strong> Analytics data is retained according to Google Analytics' default retention policies. Contact information is retained only as long as necessary for communication purposes.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Your Rights and Choices</h2>
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
                  <li><strong>Analytics Opt-Out:</strong> You can opt out of Google Analytics tracking by using browser extensions or disabling JavaScript.</li>
                  <li><strong>Local Storage:</strong> You can clear your study preferences by clearing your browser's local storage for chavrutai.com.</li>
                  <li><strong>Contact Us:</strong> You may contact us to request information about data we may have collected about you.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Third-Party Services</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our platform integrates with the following third-party services:
                </p>
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
                  <li><strong>Google Analytics:</strong> For usage analytics. See Google's privacy policy at https://policies.google.com/privacy</li>
                  <li><strong>Sefaria API:</strong> For Talmud text content. See Sefaria's privacy policy at https://www.sefaria.org/privacy-policy</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ChavrutAI is an educational platform suitable for all ages. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">International Users</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ChavrutAI is operated from the United States. If you are accessing our service from outside the United States, please be aware that information may be transferred to, stored, and processed in the United States where our servers are located.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              {/* Contact Section */}
              <section className="mt-12 pt-8 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-muted-foreground">
                    <strong>Email:</strong>{" "}
                    <a 
                      href="mailto:ezra@chavrutai.com"
                      className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                      data-testid="contact-email"
                    >
                      ezra@chavrutai.com
                    </a>
                  </p>
                  <p className="text-muted-foreground mt-2">
                    <strong>Website:</strong>{" "}
                    <a 
                      href="https://chavrutai.com"
                      className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                      data-testid="website-link"
                    >
                      https://chavrutai.com
                    </a>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}