const { chromium } = require('playwright');

function waitUntil7AM() {
  const now = new Date();
  const target = new Date();

  target.setHours(7, 0, 0, 0);

  if (now > target) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target - now;
  console.log(`Waiting ${(delay / 1000 / 60).toFixed(2)} minutes until 7:00 AM`);

  return new Promise(resolve => setTimeout(resolve, delay));
}


function getNextWeekSameDay(offset = 6) {
  const today = new Date();
  const next = new Date(today);

  next.setDate(today.getDate() + offset);

  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  const year = next.getFullYear();

  return {
    formatted: `${month}/${day}/${year}`, // MM/DD/YYYY for #date input
    dayNumber: next.getDate(),
    fullDate: next.toDateString()
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const username = process.env.CLUB_USER;
    const password = process.env.CLUB_PASS;

    if (!username || !password) {
      throw new Error('Missing CLUB_USER or CLUB_PASS environment variables.');
    }

    await page.goto('https://walmart.clubautomation.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.getByTestId('loginAccountUsername').fill(username);
    await page.getByTestId('loginAccountPassword').fill(password);
    await page.getByTestId('loginFormSubmitButton').click();

    await page.getByRole('link', { name: 'Reservations' }).click();
    await page.locator('a').filter({ hasText: 'Tennis' }).click();

    await page.locator('#component_chosen').getByText('Gym').click();
    await page.getByText('30 Min').click();

    const nextReservation = getNextWeekSameDay(6); 
    console.log(`Selecting reservation date: ${nextReservation.fullDate} (${nextReservation.formatted})`);

    await page.locator('#date').fill(nextReservation.formatted);
    await page.locator('#date').press('Enter');

    await page.locator('a').filter({ hasText: 'All Service Locations' }).click();
    await page.locator('#location_chosen').getByText('Badminton').click();

    await page.locator('#timeFrom_chosen a').filter({ hasText: ':00 PM' }).click();
    await page.locator('#timeFrom_chosen').getByText('5:00 PM').click();

    await page.locator('a').filter({ hasText: '12:00 AM' }).click();
    await page.locator('#timeTo_chosen').getByText('10:00 PM').click();

    // Uncomment for real scheduled runs
    // await waitUntil7AM();

    const start = Date.now();

    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('link', { name: '8:30pm' }).first().click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.getByRole('button', { name: 'Ok' }).click();

    const end = Date.now();
    console.log('Execution Time:', (end - start) / 1000, 'seconds');
    console.log('Reservation flow completed successfully.');
  } catch (error) {
    console.error('Reservation failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
