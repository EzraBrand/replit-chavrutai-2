import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { getBaseUrl } from "@/lib/utils";
import { PageShell, PageHeader, PageSection, SectionHeading } from "@/components/layout";

export default function Privacy() {
  const baseUrl = getBaseUrl();
  // Set up SEO
  useSEO({
    ...getStaticSEO("/privacy", baseUrl)!,
    ogUrl: `${baseUrl}/privacy`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Privacy Policy - Bekiut",
      description: "Privacy policy for Bekiut digital Talmud study platform",
      url: `${baseUrl}/privacy`,
      publisher: {
        "@type": "Organization",
        name: "Bekiut",
        url: baseUrl,
      },
    },
  });

  return (
    <PageShell>
      {/* Page title */}
      <PageHeader title="Privacy Policy">
        <p className="text-sm text-muted-foreground">
          <strong>Last updated:</strong> September 15, 2025
        </p>
      </PageHeader>

      <PageSection>
        <SectionHeading className="mb-4">Overview</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
            Bekiut ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our free Talmud study platform at bekiut.com (the "Service").
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Bekiut is a free educational platform designed to make Talmud study accessible through digital technology. We are committed to maintaining your privacy while providing the best possible learning experience.
          </p>
      </PageSection>

      <PageSection>
        <SectionHeading className="mb-4">Information We Collect</SectionHeading>

          <h3 className="text-lg font-medium text-foreground mb-3">Information You Provide</h3>
          <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
            <li><strong>Contact Information:</strong> When you contact us via email (ezra@bekiut.com), we collect your email address and any information you choose to provide in your message.</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground mb-3">Information Collected Automatically</h3>
          <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
            <li><strong>Usage Analytics:</strong> We use Google Analytics to understand how users interact with our platform, including pages visited, time spent on pages, and general usage patterns.</li>
            <li><strong>Technical Information:</strong> We may collect standard web server logs including IP addresses, browser types, device information, and referring websites.</li>
            <li><strong>Study Preferences:</strong> Your text size preferences, font selections, and display settings are stored locally on your device to enhance your study experience.</li>
          </ul>
      </PageSection>

      <PageSection>
        <SectionHeading className="mb-4">How We Use Your Information</SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
            <li><strong>Provide and Improve Our Service:</strong> To deliver Talmud study content and improve platform functionality</li>
            <li><strong>Analytics and Research:</strong> To understand usage patterns and improve the educational experience</li>
            <li><strong>Communication:</strong> To respond to your inquiries and provide support</li>
            <li><strong>Technical Operations:</strong> To maintain platform security, prevent abuse, and ensure proper functionality</li>
          </ul>
      </PageSection>

      <PageSection>
        <SectionHeading className="mb-4">Information Sharing and Disclosure</SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We do not sell, trade, or rent your personal information to third parties. We may share information in the following limited circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
            <li><strong>Service Providers:</strong> We use Google Analytics to analyze platform usage. Google's privacy policy governs their data handling practices.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights, safety, or the rights of others.</li>
            <li><strong>Text Content:</strong> Talmud text content is sourced from Sefaria.org's public API. We do not share user data with Sefaria.</li>
          </ul>
      </PageSection>

      <PageSection>
        <SectionHeading className="mb-4">Data Storage and Security</SectionHeading>
          <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
            <li><strong>Local Storage:</strong> Study preferences (text size, font, display settings) are stored locally on your device and do not leave your browser.</li>
            <li><strong>No Account Required:</strong> Bekiut does not require user accounts or personal information to access Talmud content.</li>
            <li><strong>Security Measures:</strong> We implement appropriate technical measures to protect information from unauthorized access, alteration, or destruction.</li>
            <li><strong>Data Retention:</strong> Analytics data is retained according to Google Analytics' default retention policies. Contact information is retained only as long as necessary for communication purposes.</li>
          </ul>
      </PageSection>

      <PageSection>
        <SectionHeading className="mb-4">Your Rights and Choices</SectionHeading>
          <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
            <li><strong>Analytics Opt-Out:</strong> You can opt out of Google Analytics tracking by using browser extensions or disabling JavaScript.</li>
            <li><strong>Local Storage:</strong> You can clear your study preferences by clearing your browser's local storage for bekiut.com.</li>
            <li><strong>Contact Us:</strong> You may contact us to request information about data we may have collected about you.</li>
          </ul>
      </PageSection>

      <PageSection>
        <SectionHeading className="mb-4">Third-Party Services</SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Our platform integrates with the following third-party services:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
            <li><strong>Google Analytics:</strong> For usage analytics. See Google's privacy policy at https://policies.google.com/privacy</li>
            <li><strong>Sefaria API:</strong> For Talmud text content. See Sefaria's privacy policy at https://www.sefaria.org/privacy-policy</li>
          </ul>
      </PageSection>

      <PageSection>
        <SectionHeading className="mb-4">Children's Privacy</SectionHeading>
          <p className="text-muted-foreground leading-relaxed">
            Bekiut is an educational platform suitable for all ages. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
          </p>
      </PageSection>

      <PageSection>
        <SectionHeading className="mb-4">International Users</SectionHeading>
          <p className="text-muted-foreground leading-relaxed">
            Bekiut is operated from the United States. If you are accessing our service from outside the United States, please be aware that information may be transferred to, stored, and processed in the United States where our servers are located.
          </p>
      </PageSection>

      <PageSection>
        <SectionHeading className="mb-4">Changes to This Privacy Policy</SectionHeading>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
          </p>
      </PageSection>

        {/* Contact Section */}
      <PageSection>
        <SectionHeading className="mb-4">Contact Us</SectionHeading>
          <p className="text-muted-foreground leading-relaxed mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <p className="text-muted-foreground">
            <strong>Email:</strong>{" "}
            <a
              href="mailto:ezra@bekiut.com"
              className="text-primary hover:text-primary/80 underline"
              data-testid="contact-email"
            >
              ezra@bekiut.com
            </a>
          </p>
          <p className="text-muted-foreground mt-2">
            <strong>Website:</strong>{" "}
            <a
              href="https://bekiut.com"
              className="text-primary hover:text-primary/80 underline"
              data-testid="website-link"
            >
              https://bekiut.com
            </a>
          </p>
      </PageSection>
    </PageShell>
  );
}
