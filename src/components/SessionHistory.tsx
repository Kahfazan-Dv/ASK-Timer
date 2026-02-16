import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Session, CoworkingUser } from "@/hooks/useCoworkingData";

interface SessionHistoryProps {
  sessions: Session[];
  users: CoworkingUser[];
}

export function SessionHistory({ sessions, users }: SessionHistoryProps) {
  
  const sortedSessions = [...sessions].sort((a, b) => {
    const timeA = new Date(a.end_time || a.start_time).getTime();
    const timeB = new Date(b.end_time || b.start_time).getTime();
    return timeB - timeA; 
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (hours: number | null) => {
    if (!hours) return "0m";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0 && m === 0) return "< 1m";
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <Card className="border-0 shadow-md mt-6">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="font-display text-xl">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                    No sessions recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedSessions.map((session) => {
                  const userName = users.find(u => u.id === session.user_id)?.name || "Unknown";
                  
                  return (
                    <TableRow key={session.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium font-display">{userName}</TableCell>
                      
                      <TableCell className="text-muted-foreground text-sm tabular-nums">
                        {formatDate(session.end_time || session.start_time)}
                      </TableCell>
                      
                      <TableCell className="tabular-nums">
                        {formatDuration(session.duration_hours)}
                      </TableCell>
                      
                      <TableCell>
                        {session.deducted_from_balance ? (
                          <Badge variant="secondary" className="border-green-800 text-green-400">
                            Hrs Balance
                          </Badge>
                        ) : session.payment_method === 'Prepaid' ? (
                          <Badge variant="secondary" className="border-cyan-700 text-cyan-400 hover:bg-purple-100">
                            Subscription
                          </Badge>
                        ) : session.cost_syp && session.cost_syp > 0 ? (
                          <div className="flex flex-col leading-tight">
                            <span className=" text-cyan-400 tabular-nums">
                              {Math.floor(session.cost_syp * 100).toLocaleString()} <span className="text-[10px] opacity-80">SYP ( Old )</span>
                            </span>
                            <span className="text-xs text-green-500 tabular-nums text-[13px]">
                              {session.cost_syp.toLocaleString()} <span className="text-[11px] opacity-80">SYP ( New )</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground opacity-50 text-xl leading-none">———</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={session.deducted_from_balance || session.payment_method === 'Prepaid' ? "secondary" : "outline"} className="justify-center w-16 h-7">
                          {session.payment_method || "Cash"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}