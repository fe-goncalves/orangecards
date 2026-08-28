import type { LucideIcon, LucideProps } from "lucide-react";
import {
  BarChart3,
  Download,
  GripVertical,
  Home,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  Plus,
  Save,
  Settings2,
  Trash2,
  Upload,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";

export const Icons = {
  home: Home,
  metrics: BarChart3,
  album: LayoutGrid,
  plus: Plus,
  close: X,
  grip: GripVertical,
  settings: Settings2,
  trash: Trash2,
  upload: Upload,
  save: Save,
  users: Users,
  user: User,
  mail: Mail,
  lock: Lock,
  download: Download,
  zap: Zap,
  logout: LogOut,
} as const;

export type IconName = keyof typeof Icons;

export function Icon({
  name,
  className,
  size = 18,
  strokeWidth = 1.75,
  ...props
}: {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
} & Omit<LucideProps, "ref">) {
  const Cmp: LucideIcon = Icons[name];
  return (
    <Cmp
      className={className}
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden
      {...props}
    />
  );
}
