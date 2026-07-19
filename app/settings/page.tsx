import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export default async function SettingsPage() {
  await requireAuthenticatedUser();
  redirect("/account");
}
