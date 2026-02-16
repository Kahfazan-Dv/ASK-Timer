import { useState, useEffect } from "react";
import { DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddBalance } from "@/hooks/useCoworkingData";

// Update bundles as requested
const HOURLY_BUNDLES = [
  { hours: 20, usd: 8 },
  { hours: 50, usd: 17 }
];

const SUBSCRIPTION_BUNDLES = [
  { label: "Weekly", days: 7, usd: 16 },
  { label: "Monthly", days: 30, usd: 55 },
];

export function AddBalanceDialog({ userId, userName, forcedOpen, onClose }: { userId: string; userName: string; forcedOpen?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState("0");
  const [m, setM] = useState("0");
  const [s, setS] = useState("0");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [subscriptionDays, setSubscriptionDays] = useState<number | null>(null);

  const addBalance = useAddBalance();

  useEffect(() => { if (forcedOpen) setOpen(true); }, [forcedOpen]);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val && onClose) onClose();
    if (!val) { setH("0"); setM("0"); setS("0"); setAmount(""); setSubscriptionDays(null); }
  };

  const applyHourlyBundle = (bundle: typeof HOURLY_BUNDLES[0]) => {
    setH(String(bundle.hours)); setM("0"); setS("0"); 
    setAmount(String(bundle.usd)); 
    setCurrency("USD"); 
    setSubscriptionDays(null);
  };

  const applySubscriptionBundle = (bundle: typeof SUBSCRIPTION_BUNDLES[0]) => {
    setH("0"); setM("0"); setS("0"); 
    setAmount(String(bundle.usd)); 
    setCurrency("USD"); 
    setSubscriptionDays(bundle.days);
  };

  const handleSubmit = () => {
    const a = parseFloat(amount);
    if (isNaN(a)) return; 

    if (subscriptionDays !== null) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + subscriptionDays);
      addBalance.mutate({ userId, hours: 0, amount: a, currency, subscriptionExpiry: expiryDate.toISOString() });
    } else {
      const totalHours = parseFloat(h) + (parseFloat(m) / 60) + (parseFloat(s) / 3600);
      if (totalHours <= 0) return;
      addBalance.mutate({ userId, hours: totalHours, amount: a, currency });
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-10 w-10 m-1 rounded-full text-green-600 hover:text-white hover:bg-green-600 transition-colors">
          <DollarSign className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] ">
        <DialogHeader><DialogTitle className=" text-lg">Add Balance — {userName}</DialogTitle></DialogHeader>
        <div className="space-y-6 pt-2">
          
          {/* Hourly Bundles */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block font-bold uppercase tracking-wider">Hourly Bundles ( USD OR SYP)</Label>
            <div className="flex flex-wrap gap-2">
              {HOURLY_BUNDLES.map((b) => (
                <Button key={b.hours} variant="outline" size="sm" onClick={() => applyHourlyBundle(b)} className={`hover:border-blue-500 ${subscriptionDays === null && h === String(b.hours) ? "bg-green-950/55 border-green-500" : ""}`}>
                  {b.hours} Hour / {b.usd} USD
                </Button>
              ))}
            </div>
          </div>

          {/* Subscriptions */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block font-bold uppercase tracking-wider">Subscriptions ( USD Or SYP )</Label>
            <div className="flex flex-wrap gap-2">
              {SUBSCRIPTION_BUNDLES.map((b) => (
                <Button key={b.label} variant="outline" size="sm" onClick={() => applySubscriptionBundle(b)} className={` hover:border-blue-500 text-blue-500 ${subscriptionDays === b.days ? "bg-blue-950/55 border-blue-500 ring-1 ring-blue-500" : ""}`}>
                  <Calendar className="w-3 h-3 mr-1" /> {b.label} / {b.usd} USD
                </Button>
              ))}
            </div>
          </div>

          <hr className="opacity-50" />

          {/* Time Inputs */}
          <div className={`space-y-3 transition-opacity ${subscriptionDays !== null ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
            <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Time to Add</Label>
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" value={h} onChange={(e) => setH(e.target.value)} placeholder="Hrs" />
              <Input type="number" value={m} onChange={(e) => setM(e.target.value)} placeholder="Min" />
              <Input type="number" value={s} onChange={(e) => setS(e.target.value)} placeholder="Sec" />
            </div>
          </div>

          {/* Payment Fields */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <Label>Amount Paid</Label>
              <Input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="Amount" 
                className="font-bold text-lg"
              />
              {currency === "SYP" && amount && (
                <p className="text-[10px] text-green-600 font-bold">Equals: {parseFloat(amount) / 100} SYP (New)</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="SYP">SYP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className={`w-full h-12 text-base font-bold shadow-lg ${subscriptionDays !== null ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`} onClick={handleSubmit} disabled={addBalance.isPending}>
            {subscriptionDays !== null ? "Confirm Subscription" : "Confirm & Add Balance"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}