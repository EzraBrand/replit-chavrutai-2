import { useState } from "react";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { Footer } from "@/components/footer";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

export default function Contact() {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Set up SEO
  useSEO({
    title: "Contact | ChavrutAI",
    description: "Contact ChavrutAI with feedback, suggestions, and corrections. We appreciate all input to improve our digital Talmud study platform.",
    keywords: "contact, feedback, suggestions, corrections, ChavrutAI, Talmud study, support"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast({
        title: "Please enter your feedback",
        description: "We'd love to hear what you have to say!",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // For now, just show a success message and clear the form
    // In the future, this could be connected to a backend endpoint
    setTimeout(() => {
      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate you taking the time to share your thoughts with us.",
      });
      setFeedback("");
      setIsSubmitting(false);
    }, 1000);
  };

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

              {/* Feedback Form */}
              <section className="mb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="feedback" className="text-base font-medium text-foreground">
                      Share Your Feedback, Suggestions, or Corrections
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Tell us about your experience, report any issues, or suggest improvements
                    </p>
                    <Textarea
                      id="feedback"
                      placeholder="Share your thoughts here..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="min-h-[120px] resize-y"
                      data-testid="input-feedback"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                    data-testid="button-submit-feedback"
                  >
                    {isSubmitting ? "Sending..." : "Send Feedback"}
                  </Button>
                </form>
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