import { BreadcrumbNavigation } from "@/components/navigation/breadcrumb-navigation";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { Mail } from "lucide-react";

export default function Contact() {

  // Set up SEO
  useSEO({
    title: "Contact | ChavrutAI",
    description: "Contact ChavrutAI with feedback, suggestions, and corrections. We appreciate all input to improve our digital Talmud study platform.",
    keywords: "contact, feedback, suggestions, corrections, ChavrutAI, Talmud study, support"
  });


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <BreadcrumbNavigation items={[{ label: "Contact" }]} />
          
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
                    You can also reach us directly via email:
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