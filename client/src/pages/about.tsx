import { Link } from "wouter";
import { useSEO, generateSEOData } from "@/hooks/use-seo";

export default function About() {
  // Set up SEO
  useSEO(generateSEOData.aboutPage());
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-2"
            >
              ← Back to Study
            </Link>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <h1 className="text-3xl font-bold text-foreground mb-6">About ChavrutAI</h1>
            
            <div className="prose prose-sepia max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                ChavrutAI is a modern digital platform designed to make Jewish texts, 
                particularly the Talmud, more accessible through an intuitive interface 
                that honors traditional study patterns while leveraging modern web technologies.
              </p>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                The platform features bilingual Hebrew-English text display, hierarchical 
                navigation through complex religious texts, and comprehensive text processing 
                to enhance readability while maintaining the authenticity of the source material.
              </p>
              
              <p className="text-muted-foreground leading-relaxed">
                Find out more about this project at{" "}
                <a 
                  href="https://www.ezrabrand.com/p/designing-chavrutai-building-a-customized"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                >
                  "Designing ChavrutAI: Building a Customized Talmud Interface for the Digital Age"
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}