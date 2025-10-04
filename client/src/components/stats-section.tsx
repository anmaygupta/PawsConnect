export default function StatsSection() {
  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-reunited">2,847</div>
            <div className="text-muted-foreground">Dogs Reunited</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-users">15,623</div>
            <div className="text-muted-foreground">Active Users</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-cities">342</div>
            <div className="text-muted-foreground">Cities Covered</div>
          </div>
        </div>
      </div>
    </section>
  );
}
