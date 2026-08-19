import { useRouter } from "expo-router";
import { PaywallModal } from "@/components/PaywallModal";

export default function PaywallRoute() {
  const router = useRouter();

  return <PaywallModal onClose={() => router.back()} />;
}
