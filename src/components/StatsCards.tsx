import { useState, useEffect } from "react";
import { Users, Zap, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBalanceTransactions } from "@/hooks/useCoworkingData"; // Fetch financial transactions
import type { CoworkingUser, Session } from "@/hooks/useCoworkingData";

interface StatsCardsProps {
  users: CoworkingUser[];
  sessions: Session[];
}

export function StatsCards({ users, sessions }: StatsCardsProps) {
  const { data: transactions } = useBalanceTransactions();
  
  const [revenueToday, setRevenueToday] = useState({ syp: 0, usd: 0 });

  useEffect(() => {
    const calculateTotal = () => {
      const today = new Date().toDateString();

      let dailyUsd = 0;
      let dailySypCollected = 0;

      if (transactions) {
        transactions.forEach((tx) => {
          if (new Date(tx.created_at).toDateString() === today) {
            if (tx.currency === "USD") {
              dailyUsd += Number(tx.amount_paid) || 0;
            } else if (tx.currency === "SYP") {
              dailySypCollected += Number(tx.amount_paid) || 0;
            }
          }
        });
      }

      let sypFromActiveSessions = 0;

      const finishedCashSessions = sessions.filter(
        (s) => 
          s.end_time && 
          new Date(s.start_time).toDateString() === today && 
          !s.deducted_from_balance && 
          s.payment_method !== "Prepaid"
      );
      
      finishedCashSessions.forEach(s => {
        sypFromActiveSessions += (s.duration_hours || 0) * 5000;
      });

      const activeSessions = sessions.filter((s) => !s.end_time && new Date(s.start_time).toDateString() === today);
      
      activeSessions.forEach((s) => {
        const user = users.find(u => u.id === s.user_id);
        
        const hasActiveSub = user?.subscription_expiry && new Date(user.subscription_expiry) > new Date();
        const hasHourBalance = (user?.hour_balance || 0) > 0.1; // Has hour balance

        if (!hasActiveSub && !hasHourBalance) {
          const startTime = new Date(s.start_time).getTime();
          const now = Date.now();
          const elapsedHours = (now - startTime) / 3600000;
          sypFromActiveSessions += elapsedHours * 5000;
        }
      });

      const totalSyp = dailySypCollected + sypFromActiveSessions;

      setRevenueToday({ syp: totalSyp, usd: dailyUsd });
    };

    calculateTotal();
    const interval = setInterval(calculateTotal, 1000);
    return () => clearInterval(interval);
  }, [sessions, users, transactions]);

  const activeSessionsCount = sessions.filter((s) => !s.end_time).length;

  const stats = [
    {
      label: "Total Users",
      value: users.length,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-accent",
    },
    {
      label: "Active Sessions",
      value: activeSessionsCount,
      icon: Zap,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Daily Total",
      value: (
        <div className="flex flex-col items-end gap-1 leading-tight">
          <div className="flex items-center gap-1">
            <span className="text-xl font-semibold text-cyan-400 tabular-nums">
              {Math.floor(revenueToday.syp).toLocaleString()}
            </span>
            <span className="text-[10px] text-cyan-400">SYP ( Old )</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-lg font-semibold text-green-500 tabular-nums">
              {Math.floor(revenueToday.syp / 100).toLocaleString()}
            </span>
            <span className="text-[10px] text-green-400/80">SYP ( New )</span>
          </div>

          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-white/10 w-full justify-end">
            <span className="text-xl font-bold text-blue-400 tabular-nums">
              ${revenueToday.usd.toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-300/70">Subscriptions</span>
          </div>
        </div>
      ),
      icon: Banknote,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-0 shadow-md">
          <CardContent className="flex items-start gap-4 p-5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="font-bold font-display leading-tight">
                {stat.value}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}