module.exports = async function handler({ page, context }) {
  console.log("🚀 Script started");

/*require('dotenv').config();
const puppeteer = require('puppeteer');*/

  // Configuration (same as in the Python script)
  const USERNAME = "b_leten@hotmail.com";
  const PASSWORD = "Pinterclub!";
  const FRIENDS = ["Jonas Knevels", "Birger Meuwis", "Jonathan Evens"];
  const CLUB_ID = "1408710";
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 9);  // Adding 9 days
  const day = String(bookingDate.getDate()).padStart(2, '0');  // Ensure two-digit day
  const month = String(bookingDate.getMonth() + 1).padStart(2, '0');  // Ensure two-digit month (months are zero-indexed)
  const year = bookingDate.getFullYear();
  const bookingDateFormatted = `${day}-${month}-${year}`;
  const TERRAIN_ID = "34107556";  // Padel 5 Overdekt - startplein
  const COURT_ID = "34107557";    // Padel 7 Overdekt 6 = 34107558
  const startHour = "10:00";
  const endHour = "11:30";
  const NUM_SLOTS = 3;
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  async function bookPadel() {
    
    // Launch Puppeteer
    console.log("🔧 Launching Puppeteer...");
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    // Launch browser
    console.log("✅ Puppeteer launched browser");
    const page = await browser.newPage();
    await page.goto('https://www.tennisenpadelvlaanderen.be/login', { waitUntil: 'networkidle2' });

    // Set username
    await page.type('#_com_liferay_login_web_portlet_LoginPortlet_login', USERNAME, { delay: 50 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Set Password
    await page.type('#_com_liferay_login_web_portlet_LoginPortlet_password', PASSWORD , { delay: 50 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Confirm login
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("✅ Logged in successfully");

    // Accept cookies if the banner is present
    try {
      const acceptCookiesButton = await page.$('[data-lfr-editable-id="cookie-alert-accept-all"]');
      if (acceptCookiesButton) {
        await acceptCookiesButton.click();
        console.log("✅ Cookies accepted");
      }
    } catch (e) {
      console.log("🍪 No cookie banner found");
    }

    // Navigate to booking URL
    const url = `https://www.tennisenpadelvlaanderen.be/nl/clubdashboard/reservatie?clubId=${CLUB_ID}&terrainId=${TERRAIN_ID}&sports=Padel&reservationDate=${bookingDateFormatted}&startHour=${startHour}&endHour=${endHour}&returnUrl=%2Fclubdashboard%2Freserveer-een-terrein%3FclubId%3D${CLUB_ID}%26planningDay%3D${bookingDateFormatted}%26terrainGroupId%3D16806%26ownClub%3Dtrue%26clubCourts%5B0%5D%3DI%26clubCourts%5B1%5D%3DO`;
    await page.goto(url);
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("✅ Navigated to bookingurl");

    // Add player slots
    for (let i = 0; i < NUM_SLOTS; i++) {
      try {
        // Wait for the add button and click it
        await page.waitForSelector('.tvl-icon-small-add', { visible: true, timeout: 500 });
        const addButton = await page.$('.tvl-icon-small-add');
        await addButton.click();
        console.log(`✅ Added slot`);
    
        // Wait a bit before clicking again
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to click slot button on attempt ${i + 1}:`, error);
      }
    }
    
    // Add friends
    for (let i = 0; i < FRIENDS.length; i++) {
      const friend = FRIENDS[i];
      try {
        const inputSelector = `input[id$='\\:${i + 1}:player_input']`;
        await page.type(inputSelector, friend, { delay: 100 });
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.keyboard.press('Enter');
        console.log(`✅ Added friend: ${friend}`);

        // Wait a bit before clicking again
      await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to add friend ${friend}`, error);
      }
    }

    // Wait until 19:30 before proceeding
    const waitUntilBookingTime = async () => {
      const targetTime = new Date();
      targetTime.setUTCHours(8, 0, 0, 0); // 19:30 Belgian time in UTC

      const cutoffTime = new Date();
      cutoffTime.setUTCHours(8, 30, 0, 0); // 19:30 Belgian time in UTC

      while (true) {
        const now = new Date();

        if (now > cutoffTime) {
          console.log("⏰ Too late to book — current time is after 20:00");
          await browser.close();
          process.exit(0);
        }

        if (now >= targetTime) {
          console.log("✅ Reached target time — continuing.");
          break;
        }

        const waitRemaining = (targetTime - now) / 1000;
        const minutesLeft = Math.floor(waitRemaining / 60);
        const secondsLeft = Math.floor(waitRemaining % 60);

        console.log(`⏳ Waiting for target time — ${minutesLeft}m ${secondsLeft}s left...`);
        await sleep(1000); // Wait 10 seconds before checking again (adjust if needed)
      }
    };

    console.log("🕒 Waiting until booking time…");
    await waitUntilBookingTime();
    console.log("🚀 Proceeding with booking flow…");

    // Change court selection
    await page.waitForSelector('select[id$=":terrain"]', { visible: true, timeout: 30000 });
    await page.select('select[id$=":terrain"]', COURT_ID);
    console.log("✅ Court changed");
    await new Promise(resolve => setTimeout(resolve, 500));

    // Confirm booking
    await page.$('input[value="Reserveren"]');
    const confirmButton = await page.$('input[value="Reserveren"]');
    await confirmButton.click();
    console.log("✅ Reservation confirmed");

    await browser.close();
  }

  bookPadel().catch((error) => {
    console.error("❌ Error caught:", error);
  });

  console.log("🎉 Booking finished");
};
