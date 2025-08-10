import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, Mail } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              404 Page Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/" data-testid="link-home">
              <Button className="w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                Return to Table of Contents
              </Button>
            </Link>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If errors persist, contact{" "}
                <a 
                  href="mailto:ezra@chavrutai.com"
                  className="text-primary hover:underline font-medium"
                  data-testid="link-contact-support"
                >
                  ezra@chavrutai.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
