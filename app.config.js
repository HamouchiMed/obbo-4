// Expo config to inject API_URL via environment variable
// Usage (PowerShell): $Env:API_URL="http://192.168.1.23:5000"; expo start
export default ({ config }) => ({
  ...config,
  name: config.name ?? 'obbo',
  slug: config.slug ?? 'obbo',
  extra: {
    ...(config.extra || {}),
    API_URL: process.env.API_URL,
  },
});