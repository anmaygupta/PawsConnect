import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, MapPin, Calendar, PawPrint } from "lucide-react";
import { lookupCity, getSurroundingZipCodes } from "@/lib/zipCodeLookup";
import { format } from "date-fns";

interface DogReport {
  id: string;
  type: "lost" | "found";
  animalType: "dog" | "cat";
  petName?: string;
  breed: string;
  size: string;
  age: string;
  primaryColor: string;
  gender: string;
  description: string;
  lastSeenLocation: string;
  zipCode: string;
  lastSeenDate: string;
  status: string;
  images?: Array<{ imageUrl: string }>;
}

export default function Search() {
  const { zipCode } = useParams<{ zipCode: string }>();
  const navigate = useNavigate();

  const { data: reports, isLoading, error } = useQuery<DogReport[]>({
    queryKey: ['/api/reports/search', zipCode],
    queryFn: async () => {
      if (!zipCode) return [];
      const response = await fetch(`/api/reports/search?zipCode=${zipCode}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
    enabled: !!zipCode,
  });

  const city = zipCode ? lookupCity(zipCode) : null;
  const surroundingZips = zipCode ? getSurroundingZipCodes(zipCode) : [];

  if (!zipCode) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Search for Lost Pets</h1>
          <p className="text-muted-foreground">Enter a ZIP code to see reports in your area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {city ? `Lost & Found Pets in ${city}` : `Lost & Found Pets in ${zipCode}`}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            ZIP Code: {zipCode}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-64 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load reports. Please try again.</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && reports && (
          <>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <PawPrint className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-2xl font-semibold mb-2">No reports found in this area</h2>
                <p className="text-muted-foreground mb-6">Check the surrounding areas below</p>
              </div>
            ) : (
              <div className="mb-12">
                <p className="text-sm text-muted-foreground mb-6">
                  Found {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map((report) => (
                    <Card key={report.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Report Image */}
                      {report.images && report.images.length > 0 ? (
                        <div className="h-64 overflow-hidden bg-muted">
                          <img
                            src={report.images[0].imageUrl}
                            alt={report.petName || `${report.breed} ${report.animalType}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-64 bg-muted flex items-center justify-center">
                          <PawPrint className="h-24 w-24 text-muted-foreground opacity-20" />
                        </div>
                      )}

                      <CardContent className="p-4">
                        {/* Type Badge */}
                        <div className="mb-3">
                          {report.type === 'lost' ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              Lost {report.animalType === 'dog' ? 'Dog' : 'Cat'}
                            </Badge>
                          ) : (
                            <Badge className="bg-accent text-accent-foreground flex items-center gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" />
                              Found {report.animalType === 'dog' ? 'Dog' : 'Cat'}
                            </Badge>
                          )}
                        </div>

                        {/* Pet Name */}
                        <h3 className="text-xl font-bold mb-2">
                          {report.petName || 'Unknown'}
                        </h3>

                        {/* Details */}
                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                          <p><strong>Breed:</strong> {report.breed}</p>
                          <p><strong>Color:</strong> {report.primaryColor}</p>
                          <p><strong>Size:</strong> {report.size}</p>
                          <p><strong>Age:</strong> {report.age}</p>
                        </div>

                        {/* Location & Date */}
                        <div className="space-y-2 text-sm border-t pt-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{report.lastSeenLocation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {format(new Date(report.lastSeenDate), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>

                        {/* Description Preview */}
                        {report.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Surrounding Areas */}
            {surroundingZips.length > 0 && (
              <div className="border-t pt-8">
                <h2 className="text-2xl font-semibold mb-4">
                  Didn't find what you're looking for?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Check these surrounding areas:
                </p>
                <div className="flex flex-wrap gap-3">
                  {surroundingZips.map((zip) => {
                    const surroundingCity = lookupCity(zip);
                    return (
                      <Button
                        key={zip}
                        variant="outline"
                        onClick={() => navigate(`/search/${zip}`)}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        {surroundingCity ? `${surroundingCity} (${zip})` : zip}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
