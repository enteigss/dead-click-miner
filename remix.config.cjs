/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  // This tells Remix where to put the server-side compiled code.
  // For Vercel, it MUST be 'api/index.js'.
  serverBuildPath: "build/index.js",

  // This tells Remix where to put the browser-side assets (JS, CSS).
  // This is the default, but being explicit is good.
  assetsBuildDirectory: "public/build",

  // Standard Remix settings
  ignoredRouteFiles: ["**/.*"],
  appDirectory: "app",
};