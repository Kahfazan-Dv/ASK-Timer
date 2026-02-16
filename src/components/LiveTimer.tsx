import { useEffect, useState } from "react";

export function LiveTimer({ startTime, onTick }: { startTime: string, onTick?: (elapsedHours: number) => void }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${hrs.toString().padStart(2, "0")} : ${mins.toString().padStart(2, "0")} : ${secs.toString().padStart(2, "0")}`
      );
      if (onTick) {
        onTick(diff / 3600000);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime, onTick]);

  return (
    <span className="text-base font-semibold text-green-500 tracking-tight tabular-nums m-1">
      {elapsed}
    </span>
  );
}