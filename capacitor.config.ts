import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lekris.pos",
  appName: "Lele Krispy",
  webDir: "dist",
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  }
};

export default config;
