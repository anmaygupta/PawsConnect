import ReportForm from "@/components/report-form";

export default function Report() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Report a Pet</h1>
        <ReportForm />
      </div>
    </div>
  );
}