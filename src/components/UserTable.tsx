import { useState, useRef, useEffect } from "react";
import { Play, Square, Pencil, Trash2, Plus, DollarSign, Search, AlertTriangle, CheckCircle2, CalendarDays, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LiveTimer } from "@/components/LiveTimer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { CoworkingUser, Session } from "@/hooks/useCoworkingData";
import { useAddUser, useUpdateUser, useDeleteUser, useStartSession, useEndSession, useAddBalance } from "@/hooks/useCoworkingData";
import { AddBalanceDialog } from "./AddBalanceDialog";

interface UserTableProps {
  users: CoworkingUser[];
  sessions: Session[];
}

// === Live Cost Display Component ===
const LiveCostDisplay = ({ startTime }: { startTime: string }) => {
  const [cost, setCost] = useState({ old: 0, new: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(startTime).getTime();
      const durationHours = (now - start) / 3600000;

      const oldSyp = durationHours * 5000;
      const newSyp = oldSyp / 100;

      setCost({ old: oldSyp, new: newSyp });
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex flex-col text-xs font-semibold tabular-nums">
      <span className="text-cyan-400">{Math.floor(cost.old).toLocaleString()} SYP ( Old )</span>
      <span className="text-green-500">{Math.floor(cost.new).toLocaleString()} SYP ( New )</span>
    </div>
  );
};

const ActiveSessionPill = ({ startTime }: { startTime: string }) => {
  const [displayTime, setDisplayTime] = useState("00:00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(startTime).getTime();
      const totalElapsedMs = now - start;

      const h = Math.floor(totalElapsedMs / (1000 * 60 * 60));
      const m = Math.floor((totalElapsedMs / (1000 * 60)) % 60);
      const s = Math.floor((totalElapsedMs / 1000) % 60);

      const fmt = (n: number) => n.toString().padStart(2, "0");
      setDisplayTime(`${fmt(h)}:${fmt(m)}:${fmt(s)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium transition-colors duration-500 bg-green-500/10 border-green-500/20 text-green-500">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span className="font-sans tracking-wide tabular-nums font-bold">
        {displayTime}
      </span>
    </div>
  );
};

const LiveBalance = ({ initialBalance, startTime }: { initialBalance: number, startTime?: string }) => {
  const [currentBalance, setCurrentBalance] = useState(initialBalance);

  const format = (decimalHours: number) => {
    if (decimalHours <= 0) return "0h 0m 0s";
    const h = Math.floor(decimalHours);
    const m = Math.floor((decimalHours - h) * 60);
    const s = Math.round(((decimalHours - h) * 60 - m) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  };

  return (
    <div className="font-medium text-base text-[#6952E0]">
      {startTime ? (
        <div className="hidden">
          <LiveTimer
            startTime={startTime}
            onTick={(elapsed) => {
              const remaining = initialBalance - elapsed;
              setCurrentBalance(remaining);
            }}
          />
        </div>
      ) : null}
      {initialBalance > 0 ? (currentBalance > 0 ? format(startTime ? currentBalance : initialBalance) : <span className="text-muted-foreground font-bold text-red-500">Finished</span>) : <span className="text-muted-foreground text-lg pl-2">—</span>}
    </div>
  );
};

export function UserTable({ users, sessions }: UserTableProps) {
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [expiringUser, setExpiringUser] = useState<CoworkingUser | null>(null);
  const [processedUsers, setProcessedUsers] = useState<string[]>([]);

  const [createdUser, setCreatedUser] = useState<CoworkingUser | null>(null);
  const [openBalanceId, setOpenBalanceId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const addUser = useAddUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const startSession = useStartSession();
  const endSession = useEndSession();

  const getActiveSession = (userId: string) =>
    sessions.find((s) => s.user_id === userId && !s.end_time);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSearchOpen && !searchQuery && searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen, searchQuery]);

  useEffect(() => {
    const checkAndKill = () => {
      const now = new Date();

      users.forEach(user => {
        if (processedUsers.includes(user.id)) return;
        let shouldKill = false;
        if (user.subscription_expiry) {
          if (new Date(user.subscription_expiry) <= now) {
            shouldKill = true;
          }
        }

        const activeSession = getActiveSession(user.id);
        if (activeSession && user.hour_balance > 0) {
          const startTime = new Date(activeSession.start_time).getTime();
          const elapsedHours = (now.getTime() - startTime) / 3600000;
          if (user.hour_balance - elapsedHours <= 0) {
            shouldKill = true;
          }
        }

        if (shouldKill) {
          setExpiringUser(user);
          setProcessedUsers(prev => [...prev, user.id]);
          if (activeSession) {
            handleEndSession(activeSession, user);
          }
        }
      });
    };

    const interval = setInterval(checkAndKill, 1000);
    return () => clearInterval(interval);
  }, [users, sessions, processedUsers]);

  // Play Sound
  useEffect(() => {
    if (expiringUser) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(() => { });
    }
  }, [expiringUser]);


  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const newUser = await addUser.mutateAsync(newName.trim());
      setCreatedUser(newUser);
      setNewName("");
    } catch (error) { console.error(error); }
  };
  const handleDialogChange = (open: boolean) => { setAddOpen(open); if (open) { setCreatedUser(null); setNewName(""); } };
  const handleEdit = (id: string) => { if (!editName.trim()) return; updateUser.mutate({ id, name: editName.trim() }); setEditId(null); };

  const handleEndSession = (session: Session, user: CoworkingUser) => {
    const isSubscribed = user.subscription_expiry && new Date(user.subscription_expiry) > new Date();
    endSession.mutate({ sessionId: session.id, userId: user.id, cost: isSubscribed ? 0 : undefined, paymentMethod: isSubscribed ? 'Prepaid' : undefined });
  };

  const filteredUsers = users?.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => {
    const aActive = !!getActiveSession(a.id);
    const bActive = !!getActiveSession(b.id);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return a.name.localeCompare(b.name);
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  return (
    <Card className="border-0 shadow-md relative">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b mb-4">
        <CardTitle className="font-display text-xxl">Users</CardTitle>
        <div className="flex items-center gap-2">
          <div ref={searchContainerRef} className={`relative flex items-center rounded-full transition-all duration-500 ease-in-out h-10 ${isSearchOpen ? "w-64 bg-background border border-[#6952E0] shadow-sm" : "w-10 bg-transparent border border-transparent"}`}>
            <Button variant="ghost" size="icon" className={`absolute left-0 top-0 h-10 w-10 rounded-full z-10 hover:bg-transparent transition-transform duration-300 ${isSearchOpen ? "scale-90" : "scale-100"}`} onClick={() => { if (!isSearchOpen) setIsSearchOpen(true); else if (!searchQuery) setIsSearchOpen(false); }}>
              <Search className={`h-5 w-5 ${isSearchOpen ? "text-[#6952E0]" : "text-muted-foreground"}`} />
            </Button>
            <Input ref={inputRef} placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`h-full w-full bg-transparent border-none shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-10 pr-4 text-sm transition-opacity duration-300 ${isSearchOpen ? "opacity-100 cursor-text" : "opacity-0 cursor-pointer pointer-events-none"}`} />
          </div>

          <Dialog open={addOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild><Button size="sm" className="bg-[#6952E0] gap-1.5 hover:bg-[#5b46c4] text-white"><Plus className="h-4 w-4" /> Add User</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{createdUser ? <span className="text-green-600 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> User Created Successfully</span> : "Add New User"}</DialogTitle></DialogHeader>
              {!createdUser ? (
                <div className="flex gap-2 pt-2"><Input placeholder="Enter name..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} /><Button onClick={handleAdd} disabled={addUser.isPending} className="bg-[#6952E0] hover:bg-[#5b46c4]">Add</Button></div>
              ) : (
                <div className="flex flex-col gap-4 pt-2">
                  <p className="text-center text-muted-foreground">Select an option for <span className="font-bold text-foreground">{createdUser.name}</span>:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12 border-green-500/30 hover:text-white text-green-600 hover:bg-green-950/55" onClick={() => { startSession.mutate(createdUser.id); setAddOpen(false); }}><Play className="h-4 w-4 mr-2 fill-current" /> Start Session</Button>
                    <Button className="h-12 bg-[#6952E0] hover:bg-[#5b46c4] text-white" onClick={() => { setAddOpen(false); setTimeout(() => setOpenBalanceId(createdUser.id), 150); }}><DollarSign className="h-4 w-4 mr-2" /> Add Subscription</Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)} className="text-muted-foreground w-full">Done (Close)</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[350px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead className="text-base">Name</TableHead>
                <TableHead className="text-base">Balance / Status</TableHead>
                <TableHead className="text-base">Active</TableHead>
                <TableHead className="text-base">Current Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const active = getActiveSession(user.id);
                const hasSubscription = user.subscription_expiry && new Date(user.subscription_expiry) > new Date();

                // Calculate if balance is depleted
                let isBalanceDepleted = false;
                if (user.hour_balance > 0 && active) {
                  const elapsed = (Date.now() - new Date(active.start_time).getTime()) / 3600000;
                  if (user.hour_balance - elapsed <= 0) isBalanceDepleted = true;
                }

                return (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell className="text-lg font-medium">{editId === user.id ? <div className="flex gap-2"><Input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleEdit(user.id)} className="h-8 w-40" /><Button size="sm" variant="outline" onClick={() => handleEdit(user.id)}>Save</Button></div> : user.name}</TableCell>
                    <TableCell>
                      {hasSubscription ? (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-1 rounded-md text-sm border border-blue-200 dark:border-blue-800">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(user.subscription_expiry!)}
                        </div>
                      ) : (
                        <LiveBalance initialBalance={user.hour_balance} startTime={active?.start_time} />
                      )}
                    </TableCell>
                    <TableCell>
                      {active ? <ActiveSessionPill startTime={active.start_time} /> : <span className="text-muted-foreground text-sm pl-2">-</span>}
                    </TableCell>

                    <TableCell>
                      {/* Cost: Appears only if active and (balance depleted or no subscription) */}
                      {active && !hasSubscription && (user.hour_balance <= 0 || isBalanceDepleted) ? (
                        <LiveCostDisplay startTime={active.start_time} />
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {active ? (
                          <Button size="sm" variant="destructive" className="gap-1 m-1 hover:bg-red-900" onClick={() => handleEndSession(active, user)} disabled={endSession.isPending}><Square className="h-4 w-4 fill-current" /><span className="w-8">End</span></Button>
                        ) : (
                          <Button size="sm" variant="outline" className="gap-1 m-1 hover:text-white border-green-500/30 text-green-600 hover:bg-green-500/10" onClick={() => startSession.mutate(user.id)} disabled={startSession.isPending}><Play className="h-3.5 w-3.5 fill-current" /><span className="w-8">Start</span></Button>
                        )}
                        <AddBalanceDialog userId={user.id} userName={user.name} forcedOpen={openBalanceId === user.id} onClose={() => setOpenBalanceId(null)} />
                        <Button size="icon" variant="ghost" className="h-10 w-10 m-1 rounded-full hover:bg-[#6952E0] hover:text-white" onClick={() => { setEditId(user.id); setEditName(user.name); }}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-10 w-10 m-1 rounded-full text-destructive hover:text-white hover:bg-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle><AlertDialogDescription>This will delete the user and history.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive" onClick={() => deleteUser.mutate(user.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Alert Dialog: Very Simple */}
      {expiringUser && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-2xl max-w-md w-full border-t-8 border-red-500 text-center">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Clock className="h-10 w-10 text-red-600" />
            </div>

            <h2 className="text-3xl font-black mb-2 text-slate-800 dark:text-white">Time's Up!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
              The subscription for <span className="font-bold text-[#6952E0] px-2 bg-[#6952E0]/10 rounded">{expiringUser.name}</span> has finished.
              <br />
              Session has been stopped automatically.
            </p>

            <Button
              onClick={() => {
                // Just close the dialog (Session already ended in background)
                setExpiringUser(null);
              }}
              className="w-full h-14 text-lg font-bold bg-[#6952E0] hover:bg-[#5b46c4] text-white shadow-md rounded-xl"
            >
              Okay, Dismiss
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}