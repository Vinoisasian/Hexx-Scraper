import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "../lib/utils";

interface ScheduleItem {
  id: string;
  type: string;
  day?: string;
  time?: string;
  active: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Scheduler() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [newType, setNewType] = useState("hourly");
  const [newDay, setNewDay] = useState("1");
  const [newTime, setNewTime] = useState("09:00");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const jsonStr = await invoke<string>("load_settings");
        const data = JSON.parse(jsonStr);
        if (data.schedules) {
          setSchedules(data.schedules);
        }
      } catch (err) {
        console.error("Failed to load schedules:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveSchedules = async (newList: ScheduleItem[]) => {
    try {
      const jsonStr = await invoke<string>("load_settings");
      const settings = JSON.parse(jsonStr);
      settings.schedules = newList;
      await invoke("save_settings", { settingsJson: JSON.stringify(settings, null, 2) });
    } catch (err) {
      console.error("Failed to save schedules:", err);
    }
  };

  const addSchedule = () => {
    const newItem: ScheduleItem = {
      id: crypto.randomUUID(),
      type: newType,
      day: newType === "weekly" ? newDay : undefined,
      time: (newType === "daily" || newType === "weekly") ? newTime : undefined,
      active: false // New schedules are inactive by default
    };
    const newList = [...schedules, newItem];
    setSchedules(newList);
    saveSchedules(newList);
  };

  const toggleActive = (id: string) => {
    // According to user: "it will not work unless the schedule is chosen among the list"
    // Usually this implies only one can be active at a time for a simple UI, 
    // or we just mark which one is the "chosen" one.
    const newList = schedules.map(s => ({
      ...s,
      active: s.id === id ? !s.active : false // Only one active at a time for clarity
    }));
    setSchedules(newList);
    saveSchedules(newList);
  };

  const deleteSchedule = (id: string) => {
    const newList = schedules.filter(s => s.id !== id);
    setSchedules(newList);
    saveSchedules(newList);
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading schedules...</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-10">
      {/* Add Schedule Form */}
      <section className="bg-[var(--color-slate-bg)] border border-[var(--color-border)] rounded-[var(--radius-normal)] p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold mb-1">Add New Schedule</h2>
          <p className="text-sm text-gray-400">Define a new automated scrape trigger.</p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium mb-1.5 text-gray-400 uppercase">Interval</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="block w-full px-3 py-2 h-[38px] border border-[var(--color-border)] rounded-md bg-[var(--color-slate-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-slate-primary)]"
            >
              <option value="hourly">Every Hour</option>
              <option value="daily">Every Day</option>
              <option value="weekly">Every Week</option>
            </select>
          </div>

          {newType === "weekly" && (
            <div className="min-w-[150px]">
              <label className="block text-xs font-medium mb-1.5 text-gray-400 uppercase">Day</label>
              <select
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="block w-full px-3 py-2 h-[38px] border border-[var(--color-border)] rounded-md bg-[var(--color-slate-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-slate-primary)]"
              >
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          )}

          {(newType === "daily" || newType === "weekly") && (
            <div className="min-w-[120px]">
              <label className="block text-xs font-medium mb-1.5 text-gray-400 uppercase">Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="block w-full px-3 py-2 h-[38px] border border-[var(--color-border)] rounded-md bg-[var(--color-slate-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-slate-primary)] [color-scheme:dark]"
              />
            </div>
          )}

          <button 
            onClick={addSchedule}
            className="bg-[var(--color-slate-primary)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 h-[38px]"
          >
            <Plus className="w-4 h-4" /> Add Schedule
          </button>
        </div>
      </section>

      {/* Schedule List */}
      <section className="bg-[var(--color-slate-bg)] border border-[var(--color-border)] rounded-[var(--radius-normal)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold">Configured Schedules</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-slate-surface)] text-gray-400 border-b border-[var(--color-border)]">
              <tr>
                <th className="px-4 py-3 font-medium w-12">Status</th>
                <th className="px-4 py-3 font-medium">Interval</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className={cn("border-b border-[var(--color-border)] transition-colors", s.active ? "bg-blue-500/5" : "hover:bg-[var(--color-slate-surface)]")}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(s.id)} title={s.active ? "Deactivate" : "Choose this schedule"}>
                      {s.active ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--color-slate-primary)]" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-600 hover:text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 capitalize font-medium">{s.type}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {s.type === "hourly" && "Runs at the start of every hour"}
                    {s.type === "daily" && `Runs every day at ${s.time}`}
                    {s.type === "weekly" && `Runs every ${DAYS[parseInt(s.day || "0")]} at ${s.time}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => deleteSchedule(s.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                    No schedules added yet. Use the form above to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {schedules.length > 0 && !schedules.some(s => s.active) && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-md text-sm">
          <strong>Note:</strong> No schedule is currently active. The background scraper will not run automatically until you choose one from the list above.
        </div>
      )}
    </div>
  );
}