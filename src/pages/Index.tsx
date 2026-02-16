import { Wifi } from "lucide-react";
import { StatsCards } from "@/components/StatsCards";
import { UserTable } from "@/components/UserTable";
import { SessionHistory } from "@/components/SessionHistory";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUsers, useSessions } from "@/hooks/useCoworkingData";

const Index = () => {
  const { data: users = [], isLoading: loadingUsers } = useUsers();
  const { data: sessions = [], isLoading: loadingSessions } = useSessions();

  if (loadingUsers || loadingSessions) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Wifi className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold font-display">ASK Timer</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <StatsCards users={users} sessions={sessions} />
        <UserTable users={users} sessions={sessions} />
        <SessionHistory sessions={sessions} users={users} />
      </main>
    </div>
  );
};

export default Index;
