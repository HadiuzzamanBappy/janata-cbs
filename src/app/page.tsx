import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";

export default function Home() {
  redirect(appConfig.routes.dashboard);
}
