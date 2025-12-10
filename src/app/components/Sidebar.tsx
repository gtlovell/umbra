import { Home, Network, LayoutGrid, Bot, LogOut, Plus } from "lucide-react";

interface SidebarProps {
  view: "home" | "graph" | "grid" | "chat" | "create";
  setView: (view: "home" | "graph" | "grid" | "chat" | "create") => void;
  onSignOut: () => void;
}

export default function Sidebar({ view, setView, onSignOut }: SidebarProps) {
  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "graph", label: "Graph View", icon: Network },
    { id: "grid", label: "Library", icon: LayoutGrid },
    { id: "chat", label: "Chat", icon: Bot },
  ];

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-black/50 backdrop-blur-xl border-r border-white/5 fixed left-0 top-0 z-50">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            Umbra
            <div className="w-2 h-2 border-2 border-neonyellow-600 rounded-full shadow-[0_0_10px_#ccff00]"></div>
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">v1.0</p>
        </div>

        {/* NEW NOTE BUTTON */}
        <div className="px-4 pt-6">
          <button
            onClick={() => setView("create")}
            className={`w-full bg-zinc-100 hover:bg-neon hover:text-black text-black transition-all duration-300 p-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm ${
              view === "create"
                ? "bg-neon shadow-[0_0_20px_rgba(204,255,0,0.4)]"
                : ""
            }`}
          >
            <Plus size={18} strokeWidth={2.5} /> New Note
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`group w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 font-medium text-sm ${
                view === item.id
                  ? "text-neon bg-neon/5 border border-neon/20"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              <item.icon
                size={20}
                className={`transition-transform duration-300 ${
                  view === item.id ? "text-neon" : "group-hover:text-white"
                }`}
              />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/10 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MOBILE NAV --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 flex justify-around z-50">
        <button
          onClick={() => setView("create")}
          className={`p-3 -mt-8 rounded-full bg-neon text-black shadow-lg border-4 border-black transition-transform active:scale-95`}
        >
          <Plus size={24} />
        </button>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as any)}
            className={`p-2 rounded-full transition-all ${
              view === item.id ? "text-neon bg-neon/10" : "text-zinc-500"
            }`}
          >
            <item.icon size={20} />
          </button>
        ))}
      </div>
    </>
  );
}
