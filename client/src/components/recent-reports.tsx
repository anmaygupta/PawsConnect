import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DogCard from "@/components/dog-card";
import { Eye } from "lucide-react";
import type { DogReportWithImages } from "@shared/schema";

export default function RecentReports() {
  const { data: reports = [], isLoading } = useQuery<DogReportWithImages[]>({
    queryKey: ['/api/reports/recent'],
  });

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Recent Reports</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See the latest lost and found dog reports in your area. Help us reunite these precious pets with their families.
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <i className="fas fa-paw text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">No Recent Reports</h3>
              <p className="text-muted-foreground">
                There are no recent reports to display at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {reports.map((report) => (
                <DogCard key={report.id} report={report} />
              ))}
            </div>
            
            <div className="text-center">
              <Button variant="outline" data-testid="button-view-all-reports">
                <Eye className="h-4 w-4 mr-2" />
                View All Reports
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
