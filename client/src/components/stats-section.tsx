import { useQuery } from "@tanstack/react-query";

interface Stats {
  dogsReunited: number;
  activeUsers: number;
  citiesCovered: number;
}

export default function StatsSection() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6">
                <div className="text-4xl font-bold text-primary mb-2 animate-pulse bg-primary/20 rounded h-12 w-20 mx-auto"></div>
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-reunited">
              {stats?.dogsReunited?.toLocaleString() || 0}
            </div>
            <div className="text-muted-foreground">Dogs Reunited</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-users">
              {stats?.activeUsers?.toLocaleString() || 0}
            </div>
            <div className="text-muted-foreground">Active Users</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-primary mb-2" data-testid="stat-cities">
              {stats?.citiesCovered?.toLocaleString() || 0}
            </div>
            <div className="text-muted-foreground">Cities Covered</div>
          </div>
        </div>
      </div>
    </section>
  );
}
