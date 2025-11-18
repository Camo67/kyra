import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kira.app',
  appName: 'Kira',
  webDir: 'public',
  server: {
    url: process.env.CAP_SERVER_URL || 'http://10.0.2.2:3000',
    cleartext: true,
    androidScheme: 'http',
  },
}

export default config
