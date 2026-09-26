const { chromium } = require('playwright');

async function runBrowserTests() {
  console.log('🚀 Starting Automated Browser Verification...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const results = {
    scenario1: false,
    scenario2: false,
    scenario3: false,
    details: []
  };

  try {
    // 1. Visit App
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const title = await page.title();
    console.log(`Page loaded: "${title}"`);
    results.details.push(`Page loaded with title "${title}"`);

    // --- TEST SCENARIO 1: Playback & Active Visualizer ---
    console.log('\n--- Running Scenario 1: Playback & Visualizer ---');
    const playBtn = await page.locator('#player-play-btn');
    await playBtn.waitFor({ state: 'visible' });
    await playBtn.click();
    await page.waitForTimeout(1500);

    // Check if player state changed (e.g., pause button now displayed)
    const isPlaying = await page.evaluate(() => {
      // Access Zustand store directly from window or DOM
      const playBtn = document.querySelector('#player-play-btn');
      return playBtn ? playBtn.getAttribute('title') === 'Pause' : false;
    });

    // Check visualizer canvas
    const canvasExists = await page.locator('canvas').first().isVisible();
    const isCanvasActive = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // check if any non-zero pixels exist in canvas
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i + 3] > 0) return true; // has drawn alpha
      }
      return false;
    });

    console.log(`Audio state playing: ${isPlaying}`);
    console.log(`Canvas visualizer active: ${isCanvasActive}`);

    if (isPlaying && isCanvasActive) {
      results.scenario1 = true;
      results.details.push('Scenario 1 PASSED: Audio playback started and canvas visualizer rendered active frequencies.');
    } else {
      results.details.push(`Scenario 1: playing=${isPlaying}, canvasActive=${isCanvasActive}`);
    }

    // --- TEST SCENARIO 2: Search, Queue & Reordering ---
    console.log('\n--- Running Scenario 2: Search, Queue & Reordering ---');
    const searchInput = await page.locator('#track-search-input');
    await searchInput.fill('Solar Flare');
    await page.waitForTimeout(500);

    // Verify search filtered results
    const trackTitles = await page.locator('h3').allInnerTexts();
    const hasSolar = trackTitles.some(t => t.includes('Solar Flare'));
    console.log(`Search for "Solar Flare" found matching card: ${hasSolar}`);

    // Click "Add to queue" for Solar Flare
    const addQueueBtn = await page.locator('button[title="Add to queue"]').first();
    if (await addQueueBtn.isVisible()) {
      await addQueueBtn.click();
      console.log('Clicked add to queue');
    }

    // Open Queue Drawer
    const queueToggleBtn = await page.locator('button[title="Open Queue"]');
    await queueToggleBtn.click();
    await page.waitForTimeout(500);

    // Check queue items
    const queueDrawerVisible = await page.locator('aside').isVisible();
    const queueItemTexts = await page.locator('aside h4').allInnerTexts();
    console.log(`Queue drawer open: ${queueDrawerVisible}. Items: ${queueItemTexts.length}`);

    // Reorder queue: test clicking Move Up or Move Down
    const moveDownBtn = await page.locator('aside button[title="Move down"]').first();
    if (await moveDownBtn.isVisible()) {
      await moveDownBtn.click();
      await page.waitForTimeout(300);
      console.log('Tested queue reordering (Move down)');
    }

    if (hasSolar && queueDrawerVisible && queueItemTexts.length > 0) {
      results.scenario2 = true;
      results.details.push('Scenario 2 PASSED: Track search, add to queue, and queue drawer manipulation verified.');
    }

    // --- TEST SCENARIO 3: State Persistence across Page Refresh ---
    console.log('\n--- Running Scenario 3: State Persistence ---');
    // Read state before reload
    const preReloadState = await page.evaluate(() => {
      const raw = localStorage.getItem('aurasound-storage');
      return raw ? JSON.parse(raw) : null;
    });

    console.log('Pre-reload storage currentTrack:', preReloadState?.state?.currentTrack?.title);
    console.log('Pre-reload storage queue length:', preReloadState?.state?.queue?.length);

    // Reload page
    console.log('Reloading page...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Read state after reload
    const postReloadState = await page.evaluate(() => {
      const raw = localStorage.getItem('aurasound-storage');
      return raw ? JSON.parse(raw) : null;
    });

    // Check UI displays the persisted track title
    const currentUiTrack = await page.locator('footer h4').innerText();
    console.log(`Post-reload UI current track: "${currentUiTrack}"`);

    const persistedTrackMatches = postReloadState?.state?.currentTrack?.title === currentUiTrack;
    const queuePersisted = postReloadState?.state?.queue?.length > 0;

    if (persistedTrackMatches && queuePersisted) {
      results.scenario3 = true;
      results.details.push(`Scenario 3 PASSED: Last track ("${currentUiTrack}") and queue (${postReloadState.state.queue.length} items) persisted across refresh.`);
    } else {
      results.details.push(`Scenario 3: match=${persistedTrackMatches}, queuePersisted=${queuePersisted}`);
    }

    console.log('\n=== SUMMARY OF TEST VERIFICATION ===');
    console.log('Scenario 1 (Playback & Visualizer):', results.scenario1 ? 'PASSED' : 'FAILED');
    console.log('Scenario 2 (Catalog, Search & Queue):', results.scenario2 ? 'PASSED' : 'FAILED');
    console.log('Scenario 3 (Storage Persistence):', results.scenario3 ? 'PASSED' : 'FAILED');

  } catch (error) {
    console.error('Test execution error:', error);
    results.details.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }

  return results;
}

runBrowserTests().then((res) => {
  if (res.scenario1 && res.scenario2 && res.scenario3) {
    console.log('\n🎉 ALL 3 TEST SCENARIOS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some scenarios did not pass:', res);
    process.exit(1);
  }
});
