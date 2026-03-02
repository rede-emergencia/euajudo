const puppeteer = require('puppeteer');

async function testDashboard() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    console.log('🚀 Navigating to dashboard...');
    await page.goto('http://localhost:5173/shelter-dashboard-v2', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check for any React errors
    const errors = await page.evaluate(() => {
      const errors = [];
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        if (el.textContent && el.textContent.includes('Error')) {
          errors.push(el.textContent);
        }
      });
      return errors;
    });
    
    if (errors.length > 0) {
      console.log('❌ Found errors:', errors);
    } else {
      console.log('✅ No visible errors found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard_test.png', fullPage: true });
    console.log('📸 Screenshot saved as dashboard_test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDashboard();
