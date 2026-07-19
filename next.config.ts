import type { NextConfig } from "next";

const requiredProductionEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_PMTILES_URL",
] as const;

if (process.env.NODE_ENV === "production") {
  const missing = requiredProductionEnv.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.66.180"],
};

export default nextConfig;
