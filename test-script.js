module.exports = async ({ page, context }) => {
  console.log("🧪 Test script is running");
  await page.goto("https://example.com");
  await page.screenshot({ path: "/tmp/example.png" });
  return "✅ Success!";
};
