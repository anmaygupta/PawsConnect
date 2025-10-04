import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import StatsSection from "@/components/stats-section";
import RecentReports from "@/components/recent-reports";
import { PawPrint } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <StatsSection />
      <RecentReports />
      
      {/* Footer */}
      <footer className="bg-muted py-12 border-t border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-lg font-bold text-foreground">Paw</span>
                <PawPrint className="h-5 w-5 text-primary mx-2 fill-current" />
                <span className="text-lg font-bold text-foreground">Finder</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Helping reunite lost dogs with their families through community support and technology.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#search" className="hover:text-foreground transition-colors">Search Dogs</a></li>
                <li><a href="#report" className="hover:text-foreground transition-colors">Report Lost</a></li>
                <li><a href="#report" className="hover:text-foreground transition-colors">Report Found</a></li>
                <li><a href="/donate" className="hover:text-foreground transition-colors">Donate</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">
                Emergency? Call local animal control or 911
              </p>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 Paw Finder. All rights reserved. Made with ❤️ for pets and their families.
          </div>
        </div>
      </footer>
    </div>
  );
}
