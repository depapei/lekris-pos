import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lelekrispy.app",
  appName: "Lele Krispy",
  webDir: "dist",
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
  },
};

export default config;
