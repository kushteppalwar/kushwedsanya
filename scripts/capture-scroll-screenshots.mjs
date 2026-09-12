import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

async function captureScrollScreenshots() {
  const screenshotsDir = join(process.cwd(), 'screenshots');
  await mkdir(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/wedding...');
  await page.goto('http://localhost:3000/wedding', { waitUntil: 'networkidle' });
  
  // Wait a bit for any animations to settle
  await page.waitForTimeout(2000);

  // Screenshot 1: Initial page state
  console.log('Capturing screenshot 1: Initial page state');
  await page.screenshot({ 
    path: join(screenshotsDir, '1-initial-state.png'),
    fullPage: false 
  });

  // Get the page height for calculating scroll positions
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  
  console.log(`Page scroll height: ${scrollHeight}px, Viewport height: ${viewportHeight}px`);

  // Calculate scroll steps (about 3-4 steps to cover the page)
  const totalScrollDistance = scrollHeight - viewportHeight;
  const scrollSteps = 4;
  const scrollIncrement = Math.floor(totalScrollDistance / scrollSteps);

  // Screenshot 2: After first scroll
  console.log(`Scrolling by ${scrollIncrement}px...`);
  await page.evaluate((distance) => window.scrollBy(0, distance), scrollIncrement);
  await page.waitForTimeout(1000);
  console.log('Capturing screenshot 2: After first scroll');
  await page.screenshot({ 
    path: join(screenshotsDir, '2-scroll-step-1.png'),
    fullPage: false 
  });

  // Screenshot 3: After second scroll
  console.log(`Scrolling by ${scrollIncrement}px...`);
  await page.evaluate((distance) => window.scrollBy(0, distance), scrollIncrement);
  await page.waitForTimeout(1000);
  console.log('Capturing screenshot 3: After second scroll');
  await page.screenshot({ 
    path: join(screenshotsDir, '3-scroll-step-2.png'),
    fullPage: false 
  });

  // Screenshot 4: After third scroll
  console.log(`Scrolling by ${scrollIncrement}px...`);
  await page.evaluate((distance) => window.scrollBy(0, distance), scrollIncrement);
  await page.waitForTimeout(1000);
  console.log('Capturing screenshot 4: After third scroll');
  await page.screenshot({ 
    path: join(screenshotsDir, '4-scroll-step-3.png'),
    fullPage: false 
  });

  // Screenshot 5: Final state (scroll to bottom)
  console.log('Scrolling to bottom...');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1000);
  console.log('Capturing screenshot 5: Final state at bottom');
  await page.screenshot({ 
    path: join(screenshotsDir, '5-final-bottom.png'),
    fullPage: false 
  });

  // Bonus: Full page screenshot
  console.log('Capturing full page screenshot...');
  await page.screenshot({ 
    path: join(screenshotsDir, '6-full-page.png'),
    fullPage: true 
  });

  await browser.close();
  console.log('\nAll screenshots saved to:', screenshotsDir);
  console.log('Screenshots captured:');
  console.log('  1-initial-state.png - Initial page load');
  console.log('  2-scroll-step-1.png - After first scroll');
  console.log('  3-scroll-step-2.png - After second scroll');
  console.log('  4-scroll-step-3.png - After third scroll');
  console.log('  5-final-bottom.png - Bottom of page');
  console.log('  6-full-page.png - Full page view');
}

captureScrollScreenshots().catch(console.error);
