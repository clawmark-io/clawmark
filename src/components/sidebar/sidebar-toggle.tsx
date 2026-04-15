import { Menu } from "lucide-react";
import { useSidebarState } from "@/stores/sidebar";

export function SidebarToggle() {
  const toggle = useSidebarState((s) => s.toggle);

  return (
    <button
      onClick={toggle}
      className="sidebar-toggle btn btn-ghost btn-square btn-sm"
      aria-label="Toggle sidebar"
    >
      <Menu size={20} />
    </button>
  );
}
