/**
 * @file src/components/icons.ts
 * Central registry for all lucide-react-native icons used in the app.
 * Import icons from here — never directly from lucide-react-native in UI files.
 */
import { type ComponentType } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellOff,
  BookImage,
  Camera,
  Check,
  Droplet,
  Droplets,
  Gem,
  Heart,
  Image as ImageLucide,
  Leaf,
  Lock,
  LogIn,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  UserCircle2,
  X,
} from "lucide-react-native";

export type IconProps = { color?: string; size?: number; strokeWidth?: number };
type Icon = ComponentType<IconProps>;
const cast = (c: unknown): Icon => c as Icon;

export const AlertIcon    = cast(AlertTriangle);
export const BackIcon     = cast(ArrowLeft);
export const BellIcon     = cast(Bell);
export const BellOffIcon  = cast(BellOff);
export const BookIcon     = cast(BookImage);
export const CameraIcon   = cast(Camera);
export const CheckIcon    = cast(Check);
export const DropletIcon  = cast(Droplet);
export const DropletsIcon = cast(Droplets);
export const GemIcon      = cast(Gem);
export const HeartIcon    = cast(Heart);
export const GalleryIcon  = cast(ImageLucide);
export const LeafIcon     = cast(Leaf);
export const LockIcon     = cast(Lock);
export const LogInIcon    = cast(LogIn);
export const EditIcon     = cast(Pencil);
export const PlusIcon     = cast(Plus);
export const SettingsIcon = cast(Settings);
export const ShieldIcon   = cast(ShieldCheck);
export const SparklesIcon = cast(Sparkles);
export const SproutIcon   = cast(Sprout);
export const SunIcon      = cast(Sun);
export const UserIcon     = cast(UserCircle2);
export const CloseIcon    = cast(X);
