import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import DogCard from "@/components/dog-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search as SearchIcon, MapPin } from "lucide-react";
import { lookupCity, formatConfirmation } from "@/lib/zipCodeLookup";
import type { DogReportWithImages } from "@shared/schema";

export default function Search() {
  const params = useParams();
  const initialZipCode = params.zipCode || "";
  const [zipCode, setZipCode] = useState(initialZipCode);
  const [searchZip, setSearchZip] = useState(initialZipCode);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: reports = [], isLoading, error } = useQuery<DogReportWithImages[]>({
    queryKey: ['/api/reports/search', searchZip],
    enabled: !!searchZip,
  });

  const handleSearch = () => {
    if (zipCode.trim() && zipCode.length >= 5) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = () => {
    setSearchZip(zipCode.trim());
    setShowConfirmation(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Search Header */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Search Lost & Found Dogs
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Enter a ZIP code to see lost and found dog reports in that area
            </p>
            
            <div className="max-w-md mx-auto">
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter ZIP code"
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value);
                      setShowConfirmation(false);
                    }}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                    data-testid="input-zip-code"
                    maxLength={5}
                  />
                </div>
                {!showConfirmation ? (
                  <Button 
                    onClick={handleSearch} 
                    disabled={!zipCode.trim() || zipCode.length < 5} 
                    data-testid="button-search"
                  >
                    <SearchIcon className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleConfirm}
                      data-testid="button-search-confirm"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Confirm: {formatConfirmation(zipCode)}
                    </Button>
                    <Button 
                      onClick={handleCancel}
                      variant="outline"
                      data-testid="button-search-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {!searchZip ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start Your Search</h3>
                  <p className="text-muted-foreground">
                    Enter a ZIP code above to find lost and found dog reports in that area
                  </p>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Searching in {searchZip}...
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-48 bg-muted rounded-t-lg"></div>
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-destructive mb-4">
                    <i className="fas fa-exclamation-triangle text-4xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Search Error</h3>
                  <p className="text-muted-foreground">
                    Failed to search reports. Please try again.
                  </p>
                  <Button onClick={handleSearch} className="mt-4" data-testid="button-retry-search">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Reports in {searchZip}
                  </h2>
                  <div className="text-sm text-muted-foreground">
                    {reports.length} report{reports.length !== 1 ? 's' : ''} found
                  </div>
                </div>
                
                {reports.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                      <p className="text-muted-foreground mb-4">
                        There are no active lost or found dog reports in {searchZip} at this time.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try searching a nearby ZIP code or check back later.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                      <DogCard key={report.id} report={report} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
