import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// === Constants and Updated Prices ===
const SYP_PER_HOUR = 50; // New value (50)
const OLD_SYP_MULTIPLIER = 100; // To convert to 5000 (Old)

// === Types ===
export type CoworkingUser = {
  id: string;
  name: string;
  hour_balance: number;
  subscription_expiry: string | null;
  created_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_hours: number | null;
  cost_syp: number | null;
  cost_usd: number | null;
  payment_method: string | null;
  currency?: string; // Field added
  cost?: number;    // Field added for calculation ease
  deducted_from_balance: boolean | null;
  created_at: string;
};

export type BalanceTransaction = {
  id: string;
  user_id: string;
  hours_added: number;
  amount_paid: number;
  currency: string;
  created_at: string;
};

// ... (Functions useUsers, useSessions, useBalanceTransactions remain unchanged)

export function useUsers() {
  return useQuery({
    queryKey: ["coworking_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coworking_users")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as CoworkingUser[];
    },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data as Session[];
    },
  });
}

export function useBalanceTransactions(userId?: string) {
  return useQuery({
    queryKey: ["balance_transactions", userId],
    queryFn: async () => {
      let query = supabase.from("balance_transactions").select("*").order("created_at", { ascending: false });
      if (userId) query = query.eq("user_id", userId);
      const { data, error } = await query;
      if (error) {
        console.warn("Error fetching transactions:", error);
        return [];
      }
      return data as BalanceTransaction[];
    },
  });
}

// ... (Functions useAddUser, useUpdateUser, useDeleteUser, useStartSession remain unchanged)

export function useAddUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("coworking_users").insert({ name }).select().single();
      if (error) throw error;
      return data as CoworkingUser;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coworking_users"] });
      toast({ title: "User added" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("coworking_users").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coworking_users"] });
      toast({ title: "User updated" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coworking_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coworking_users"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast({ title: "User deleted" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("sessions").insert({ user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast({ title: "Session started" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useEndSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, userId, cost, paymentMethod }: { sessionId: string; userId: string; cost?: number; paymentMethod?: string }) => {
      const now = new Date().toISOString();
      const { data: session } = await supabase.from("sessions").select("start_time").eq("id", sessionId).single();
      const { data: user } = await supabase.from("coworking_users").select("*").eq("id", userId).single();
      
      const durationHours = (new Date(now).getTime() - new Date(session.start_time).getTime()) / 3600000;
      const hasActiveSub = user.subscription_expiry && new Date(user.subscription_expiry) > new Date();

      let deducted = false;
      let costSyp: number | null = cost !== undefined ? cost : null;
      let finalPaymentMethod = paymentMethod || null;
      let newBalance = user.hour_balance;

      if (hasActiveSub) {
        costSyp = 0;
        finalPaymentMethod = "Prepaid";
      } else if (user.hour_balance > 0) {
        deducted = true;
        newBalance = Math.max(0, user.hour_balance - durationHours);
        if (newBalance === 0) {
          const uncovered = durationHours - user.hour_balance;
          costSyp = Math.round(uncovered * SYP_PER_HOUR);
        }
      } else if (cost === undefined) {
        costSyp = Math.round(durationHours * SYP_PER_HOUR);
      }

      await supabase.from("sessions").update({
        end_time: now,
        duration_hours: Math.round(durationHours * 1000) / 1000,
        cost_syp: costSyp,
        payment_method: finalPaymentMethod,
        deducted_from_balance: deducted,
      }).eq("id", sessionId);

      if (!hasActiveSub) {
        await supabase.from("coworking_users").update({ hour_balance: Math.round(newBalance * 1000) / 1000 }).eq("id", userId);
      }
      return { durationHours, costSyp, isSubscribed: hasActiveSub };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["coworking_users"] });
      const mins = Math.round(result.durationHours * 60);
      const costNew = result.costSyp || 0;
      const costOld = costNew * OLD_SYP_MULTIPLIER;

      toast({
        title: result.isSubscribed ? "Subscription session ended" : "Session ended",
        description: `Duration: ${mins} min. ${result.costSyp ? `Cost: ${costNew} (${costOld.toLocaleString()}) SYP` : result.isSubscribed ? "Status: Prepaid" : ""}`,
      });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// === Core function modified for linkage ===
export function useAddBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, hours, amount, currency, subscriptionExpiry }: { 
      userId: string; 
      hours: number; 
      amount: number; 
      currency: string; 
      subscriptionExpiry?: string 
    }) => {
      // 1. Record financial transaction (for daily total)
      const { error: txErr } = await supabase.from("balance_transactions").insert({ 
        user_id: userId, 
        hours_added: hours, 
        amount_paid: amount, 
        currency: currency // "USD" or "SYP"
      });
      if (txErr) console.warn("Transaction log failed", txErr);

      // 2. Update user data
      const updateData: any = {};
      if (subscriptionExpiry) {
        updateData.subscription_expiry = subscriptionExpiry;
        updateData.hour_balance = 0; // Reset hours when activating subscription (weekly/monthly)
      } else {
        const { data: user } = await supabase.from("coworking_users").select("hour_balance").eq("id", userId).single();
        updateData.hour_balance = (user?.hour_balance || 0) + hours;
        // If topping up normal hours, do not reset subscription if it exists, unless desired
      }
      
      const { error } = await supabase.from("coworking_users").update(updateData).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coworking_users"] });
      qc.invalidateQueries({ queryKey: ["balance_transactions"] });
      toast({ title: "Balance and daily total updated successfully" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}