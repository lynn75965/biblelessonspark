import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Notif = { 
  id: string; 
  title: string; 
  body?: string | null; 
  href?: string | null; 
  created_at: string; 
  read_at?: string | null 
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('notifications-list');
      if (error) {
        console.error("notif list error", error);
      } else {
        setItems(data?.items ?? []);
        setUnread(data?.unreadCount ?? 0);
      }

      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.role === 'admin');
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  async function seedSampleNotifications() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-notifications');
      if (error) {
        console.error("seed error", error);
      } else if (data?.ok) {
        // Reload the list
        await load();
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) await load();
  }

  async function onClickItem(n: Notif) {
    if (!n.read_at) {
      // optimistic UI
      setItems(prev => prev.map(x => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setUnread(u => Math.max(0, u - 1));
      supabase.functions.invoke('notifications-mark-read', {
        body: { id: n.id }
      }).catch(() => {});
    }
    if (n.href) {
      navigate(n.href);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative z-[60]">
      <button
        onClick={toggle}
        data-testid="notif-bell"
        aria-label="Notifications"
        className="relative rounded-full p-2 hover:bg-accent"
      >
        <span className="text-xl" role="img" aria-hidden>🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-card shadow-lg z-[70]">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="text-sm font-semibold">Notifications</div>
            <button onClick={load} className="text-xs text-muted-foreground hover:text-foreground" title="Refresh">↻</button>
          </div>
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-2">You're all caught up.</div>
              {isAdmin && (
                <button
                  onClick={seedSampleNotifications}
                  className="text-xs text-primary hover:underline"
                >
                  Load sample notifications
                </button>
              )}
            </div>
          ) : (
            <ul className="max-h-96 divide-y overflow-auto">
              {items.map((n) => (
                <li
                  key={n.id}
                  onClick={() => onClickItem(n)}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent ${n.read_at ? "text-muted-foreground" : "bg-accent/30"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{n.title}</div>
                      {n.body ? <div className="text-xs text-muted-foreground">{n.body}</div> : null}
                    </div>
                    {!n.read_at && <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
