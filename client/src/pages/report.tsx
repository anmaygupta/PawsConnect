import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import ReportForm from "@/components/report-form";

export default function Report() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/auth/google";
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Report a Lost or Found Pet</h1>
          <p className="text-center text-muted-foreground mb-8">
            Help reunite lost cats and dogs with their families by reporting found pets or submitting lost pet reports.
          </p>
          <ReportForm />
        </div>
      </div>
    </div>
  );
}