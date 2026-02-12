import { Link } from "wouter";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { Mail } from "lucide-react";

export default function Contact() {

  // Set up SEO
  useSEO({
    title: "Contact | ChavrutAI",
    description: "Contact ChavrutAI with feedback, suggestions, and corrections. We appreciate all input to improve our digital Talmud study platform.",
    keywords: "contact, feedback, suggestions, corrections, ChavrutAI, Talmud study, support",
    canonical: `${window.location.origin}/contact`,
    robots: "index, follow",
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
            <h1 className="text-3xl font-bold text-foreground mb-6">Contact ChavrutAI</h1>
            
            <div className="prose prose-sepia max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">We'd Love to Hear From You</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  ChavrutAI is constantly evolving to better serve the Jewish learning community. Your feedback, suggestions, and corrections help us improve the platform for everyone.
                </p>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  <strong>Any feedback is appreciated!</strong> Whether you've found an error, have ideas for new features, or simply want to share your experience using ChavrutAI.
                </p>
              </section>


              {/* Direct Email Contact */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Direct Email Contact</h2>
                <div className="bg-muted/50 rounded-lg p-6 border border-border">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You can reach us via email:
                  </p>
                  <a 
                    href="mailto:ezra@chavrutai.com"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-lg transition-colors duration-200"
                    data-testid="link-email-contact"
                  >
                    <Mail size={20} />
                    ezra@chavrutai.com
                  </a>
                </div>
              </section>

              {/* About the Project */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">About This Project</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ChavrutAI is a project of{" "}
                  <a 
                    href="https://www.ezrabrand.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                    data-testid="link-talmud-tech-about"
                  >
                    "Talmud & Tech"
                  </a>
                  , dedicated to bringing Jewish learning into the digital age. We use authentic text data from Sefaria to ensure accuracy and reliability.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}