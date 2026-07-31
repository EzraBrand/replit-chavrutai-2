import { Link } from "wouter";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { HeaderSimple } from "@/components/layout/header-simple";

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
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Centered Logo Header */}
      <HeaderSimple />

      <main className="max-w-content mx-auto px-6">
        {/* Page title */}
        <div className="pt-10 pb-8">
          <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-2">Contact ChavrutAI</h1>
          <p className="text-muted-foreground">
            We'd love to hear from you — feedback, suggestions, and corrections all welcome.
          </p>
        </div>

        <section className="py-8 border-t border-border">
          <h2 className="font-georgia text-xl text-foreground mb-4">We'd Love to Hear From You</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            ChavrutAI is constantly evolving to better serve the Jewish learning community. Your feedback, suggestions, and corrections help us improve the platform for everyone.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            <strong>Any feedback is appreciated!</strong> Whether you've found an error, have ideas for new features, or simply want to share your experience using ChavrutAI.
          </p>
        </section>

        {/* Direct Email Contact */}
        <section className="py-8 border-t border-border">
          <h2 className="font-georgia text-xl text-foreground mb-4">Direct Email Contact</h2>
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
        </section>

        {/* About the Project */}
        <section className="py-8 border-t border-border">
          <h2 className="font-georgia text-xl text-foreground mb-4">About This Project</h2>
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
        </section>
      </main>

      <Footer />
    </div>
  );
}
