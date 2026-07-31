import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { PageShell, PageHeader, PageSection, SectionHeading } from "@/components/layout";

export default function Contact() {

  // Set up SEO
  useSEO({
    ...getStaticSEO("/contact", window.location.origin)!,
    keywords: "contact, feedback, suggestions, corrections, ChavrutAI, Talmud study, support",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact ChavrutAI",
      description: "Contact ChavrutAI with feedback, suggestions, and corrections",
      url: `${window.location.origin}/contact`,
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
    },
  });


  return (
    <PageShell>
      {/* Page title */}
      <PageHeader title="Contact ChavrutAI">
        <p className="text-muted-foreground">
          We'd love to hear from you — feedback, suggestions, and corrections all welcome.
        </p>
      </PageHeader>

      <PageSection>
        <SectionHeading className="mb-4">We'd Love to Hear From You</SectionHeading>
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
          ChavrutAI is constantly evolving to better serve the Jewish learning community. Your feedback, suggestions, and corrections help us improve the platform for everyone.
        </p>

        <p className="text-muted-foreground leading-relaxed">
          <strong>Any feedback is appreciated!</strong> Whether you've found an error, have ideas for new features, or simply want to share your experience using ChavrutAI.
        </p>
      </PageSection>

      {/* Direct Email Contact */}
      <PageSection>
        <SectionHeading className="mb-4">Direct Email Contact</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          You can reach us via email:
        </p>
        <a
          href="mailto:ezra@chavrutai.com"
          className="text-primary hover:text-primary/80 font-medium text-lg"
          data-testid="link-email-contact"
        >
          ezra@chavrutai.com
        </a>
      </PageSection>

      {/* About the Project */}
      <PageSection>
        <SectionHeading className="mb-4">About This Project</SectionHeading>
        <p className="text-muted-foreground leading-relaxed">
          ChavrutAI is a project of{" "}
          <a
            href="https://www.ezrabrand.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline"
            data-testid="link-talmud-tech-about"
          >
            "Talmud & Tech"
          </a>
          , dedicated to bringing Jewish learning into the digital age. We use authentic text data from Sefaria to ensure accuracy and reliability.
        </p>
      </PageSection>
    </PageShell>
  );
}
