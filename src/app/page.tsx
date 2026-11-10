import { redirect } from "next/navigation";
import { clientConfig } from "@/lib/core-config";

export default function Home() {
  redirect(clientConfig.routes.dashboard);
}
