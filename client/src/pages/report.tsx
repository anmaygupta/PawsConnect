import ReportForm from "@/components/report-form";

export default function Report() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Report a Lost or Found Pet</h1>
        <p className="text-center text-muted-foreground mb-8">
          Help reunite lost cats and dogs with their families by reporting found pets or submitting lost pet reports.
        </p>
        <ReportForm />
      </div>
    </div>
  );
}