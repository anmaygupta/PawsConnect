import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import RecentReports from "@/components/recent-reports";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { PlusCircle, Search, PawPrint } from "lucide-react";
import PawLogo from "@/components/paw-logo";
import type { DogReportWithImages } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: userReports = [], isLoading: reportsLoading } = useQuery<DogReportWithImages[]>({
    queryKey: ["/api/reports"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Welcome Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 flex items-center justify-center">
              Welcome to 
              <span className="ml-2">Paw</span>
              <PawLogo className="text-primary mx-2" size={40} />
              <span>Finder</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Help reunite lost dogs with their families or find homes for found pets
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/report")}>
                <CardHeader className="text-center">
                  <PlusCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <CardTitle className="text-lg">Report Lost Dog</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Report a missing dog with photos and details to help the community find them
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/report")}>
                <CardHeader className="text-center">
                  <PawPrint className="h-12 w-12 text-primary mx-auto mb-4 fill-current" />
                  <CardTitle className="text-lg">Report Found Dog</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Found a dog? Report it here to help reunite them with their family
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/search")}>
                <CardHeader className="text-center">
                  <Search className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-lg">Search Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Search for lost and found dogs in your area by ZIP code
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* User's Reports */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">Your Reports</h2>
              <Button onClick={() => setLocation("/report")} data-testid="button-create-report">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
            
            {reportsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
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
            ) : userReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <PlusCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any reports yet. Start by reporting a lost or found dog.
                  </p>
                  <Button onClick={() => setLocation("/report")} data-testid="button-create-first-report">
                    Create Your First Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-lg transition-shadow">
                    <div className="relative">
                      {report.images.length > 0 ? (
                        <img 
                          src={report.images[0].imageUrl} 
                          alt={report.dogName || 'Dog'}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                          <i className="fas fa-paw text-4xl text-muted-foreground"></i>
                        </div>
                      )}
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-medium ${
                        report.type === 'lost' 
                          ? 'bg-destructive text-destructive-foreground' 
                          : 'bg-accent text-accent-foreground'
                      }`}>
                        <i className={`fas ${report.type === 'lost' ? 'fa-exclamation-triangle' : 'fa-check-circle'} mr-1`}></i>
                        {report.type.toUpperCase()}
                      </div>
                      {report.rewardAmount && (
                        <div className="absolute top-3 right-3 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          ${report.rewardAmount} Reward
                        </div>
                      )}
                      <div className={`absolute bottom-3 left-3 px-2 py-1 rounded text-xs font-medium ${
                        report.status === 'active' 
                          ? 'bg-accent text-accent-foreground'
                          : report.status === 'resolved'
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {report.status.toUpperCase()}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2" data-testid={`text-dog-name-${report.id}`}>
                        {report.dogName || 'Unnamed Dog'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {report.breed} • {report.gender} • {report.age}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {report.lastSeenLocation}, {report.zipCode}
                      </p>
                      <p className="text-sm text-foreground line-clamp-2 mb-4">
                        {report.description}
                      </p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{new Date(report.createdAt!).toLocaleDateString()}</span>
                        <span className="flex items-center">
                          <i className="fas fa-eye mr-1"></i>
                          View Details
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <RecentReports />
    </div>
  );
}
