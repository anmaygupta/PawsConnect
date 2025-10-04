import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, CheckCircle, MapPin } from "lucide-react";
import { lookupCity, formatConfirmation } from "@/lib/zipCodeLookup";

export default function HeroSection() {
  const [zipCode, setZipCode] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (zipCode.trim() && zipCode.length >= 5) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = () => {
    navigate(`/search/${zipCode.trim()}`);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showConfirmation) {
        handleConfirm();
      } else {
        handleSearch();
      }
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleReportLost = () => {
    window.location.href = "/api/login";
  };

  const handleReportFound = () => {
    window.location.href = "/api/login";
  };

  return (
    <section className="hero-gradient text-white py-20 relative">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Reuniting Lost Pets<br />
            <span className="text-secondary">with Their Families</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Join our community of pet lovers helping bring lost cats and dogs home safely
          </p>
          
          <div className="glass-effect rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Enter your zip code to see local reports</h3>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="text"
                placeholder="Enter ZIP code"
                value={zipCode}
                onChange={(e) => {
                  setZipCode(e.target.value);
                  setShowConfirmation(false);
                }}
                onKeyPress={handleKeyPress}
                className="flex-1 text-foreground bg-white/90 border-white/20"
                data-testid="input-hero-zip-code"
                maxLength={5}
              />
              {!showConfirmation ? (
                <Button 
                  onClick={handleSearch}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={!zipCode.trim() || zipCode.length < 5}
                  data-testid="button-hero-search"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleConfirm}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    data-testid="button-hero-confirm"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Confirm: {formatConfirmation(zipCode)}
                  </Button>
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    className="bg-white/90 text-foreground border-white/30 hover:bg-white"
                    data-testid="button-hero-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleReportLost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-lg py-4 px-8"
              data-testid="button-report-lost"
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              Report Lost Dog
            </Button>
            <Button 
              onClick={handleReportFound}
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-4 px-8"
              data-testid="button-report-found"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Report Found Dog
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
