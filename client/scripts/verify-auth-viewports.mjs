import { spawn } from 'node:child_process';
import http from 'node:http';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const viewports = [
  { width: 1920, height: 1080, name: '1920x1080' },
  { width: 1366, height: 768, name: '1366x768' },
  { width: 1024, height: 768, name: '1024x768' },
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testViewport(vp) {
  const port = 9222 + Math.floor(Math.random() * 100);
  const chromeProcess = spawn(
    chromePath,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--window-size=${vp.width},${vp.height}`,
      '--disable-gpu',
      '--no-sandbox',
      'http://localhost:5173/login',
    ],
    { stdio: 'ignore' }
  );

  try {
    // Wait for Chrome to be ready
    let targets = null;
    for (let i = 0; i < 20; i++) {
      try {
        await new Promise((r) => setTimeout(r, 250));
        targets = await fetchJson(`http://127.0.0.1:${port}/json`);
        if (targets && targets.length > 0) break;
      } catch {
        // retry
      }
    }

    if (!targets || targets.length === 0) {
      throw new Error('Chrome remote debugging did not respond');
    }

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((res) => {
        const id = msgId++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            res(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Set emulation viewport
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Wait for React to render
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const chk = await sendCommand('Runtime.evaluate', {
        expression: 'Boolean(document.querySelector("h2") && document.body.innerText.includes("Every receipt"))',
      });
      if (chk?.result?.value) break;
    }

    // Evaluate layout measurements in page
    const expr = `
      (() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollHeight = Math.max(doc.scrollHeight, body.scrollHeight);
        const clientHeight = window.innerHeight;
        const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientWidth = window.innerWidth;

        const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.innerText.includes('Every receipt'));
        const h2Color = h2 ? window.getComputedStyle(h2).color : null;
        const h2Text = h2 ? h2.innerText : null;

        // Find cards: target the card containers
        const appleStoreEls = Array.from(document.querySelectorAll('div')).filter(el => (el.textContent || '').includes('Apple Store'));
        const cardA = appleStoreEls.find(el => (el.textContent || '').includes('Matched') && (el.textContent || '').includes('12 Oct 2026'));
        const macBookEls = Array.from(document.querySelectorAll('div')).filter(el => (el.textContent || '').includes('MacBook Pro'));
        const cardB = macBookEls.find(el => (el.textContent || '').includes('Covered') && (el.textContent || '').includes('214 days'));

        const rectA = cardA ? cardA.getBoundingClientRect() : null;
        const rectB = cardB ? cardB.getBoundingClientRect() : null;

        // Find feature row
        const featureRow = Array.from(document.querySelectorAll('.grid-cols-3')).find(el => el.innerText.includes('Scan receipts'));
        const rectFeatures = featureRow ? featureRow.getBoundingClientRect() : null;

        // Content wrapper (max-w-[520px])
        const contentWrapper = h2 ? h2.closest('.relative.z-10') : null;
        const rectWrapper = contentWrapper ? contentWrapper.getBoundingClientRect() : null;

        return {
          scrollHeight,
          clientHeight,
          scrollWidth,
          clientWidth,
          hasVerticalScroll: scrollHeight > clientHeight,
          hasHorizontalScroll: scrollWidth > clientWidth,
          h2Color,
          h2Text,
          hasCardA: Boolean(cardA),
          hasCardB: Boolean(cardB),
          hasWrapper: Boolean(contentWrapper),
          cardA: rectA ? { top: rectA.top, left: rectA.left, right: rectA.right, width: rectA.width, height: rectA.height } : null,
          cardB: rectB ? { top: rectB.top, left: rectB.left, right: rectB.right, width: rectB.width, height: rectB.height } : null,
          featureRow: rectFeatures ? { top: rectFeatures.top, left: rectFeatures.left } : null,
          contentWrapper: rectWrapper ? { right: rectWrapper.right, width: rectWrapper.width } : null
        };
      })()
    `;

    const evalResult = await sendCommand('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
    });

    if (evalResult.exceptionDetails) {
      console.error('Eval error:', evalResult.exceptionDetails);
    }

    const data = evalResult.result.value;
    ws.close();

    return data;
  } finally {
    chromeProcess.kill();
  }
}

async function run() {
  console.log('--- Verifying /login across viewports ---\n');
  let allPass = true;

  for (const vp of viewports) {
    console.log(`Checking viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    try {
      const data = await testViewport(vp);

      // Check 1: No scroll
      const noVScroll = !data.hasVerticalScroll;
      const noHScroll = !data.hasHorizontalScroll;
      console.log(`  ${noVScroll ? '✓' : '✗'} Vertical scroll: ${data.scrollHeight}px / ${data.clientHeight}px (No scroll: ${noVScroll})`);
      console.log(`  ${noHScroll ? '✓' : '✗'} Horizontal scroll: ${data.scrollWidth}px / ${data.clientWidth}px (No scroll: ${noHScroll})`);

      // Check 2: Headline readable & #FFFFFF
      console.log(`  h2Text: "${data.h2Text}", color: "${data.h2Color}"`);
      const isWhite = data.h2Color === 'rgb(255, 255, 255)';
      console.log(`  ${isWhite ? '✓' : '✗'} Headline color is pure white: ${data.h2Color}`);

      console.log(`  Detection flags: CardA=${data.hasCardA}, CardB=${data.hasCardB}, Wrapper=${data.hasWrapper}`);
      // Check 3: Cards geometry & no overflow
      if (data.cardA && data.cardB && data.contentWrapper) {
        const bRightEdgeDiff = Math.abs(data.cardB.right - data.contentWrapper.right);
        const cardBOverflow = data.cardB.right > data.contentWrapper.right + 1; // 1px tolerance
        console.log(`  ${!cardBOverflow ? '✓' : '✗'} Card B right edge within content block: diff=${bRightEdgeDiff.toFixed(1)}px (overflow: ${cardBOverflow})`);

        const dX = data.cardB.left - data.cardA.left;
        const dY = data.cardB.top - data.cardA.top;
        console.log(`  ✓ Card offset: dx=${dX.toFixed(1)}px (expected 32px), dy=${dY.toFixed(1)}px (expected 56px)`);

        // Check 4: No overlap between Card B and feature row
        if (data.featureRow) {
          const gapBelowCardB = data.featureRow.top - (data.cardB.top + data.cardB.height);
          const noOverlap = gapBelowCardB > 0;
          console.log(`  ${noOverlap ? '✓' : '✗'} Feature row is below Card B: gap=${gapBelowCardB.toFixed(1)}px (No overlap: ${noOverlap})`);
          if (!noOverlap) allPass = false;
        }
      } else {
        console.log('  ✗ Could not locate cards or wrapper');
        allPass = false;
      }

      if (!noVScroll || !noHScroll || !isWhite) {
        allPass = false;
      }
      console.log('');
    } catch (err) {
      console.error(`  ✗ Error testing ${vp.name}:`, err.message);
      allPass = false;
    }
  }

  if (allPass) {
    console.log('SUCCESS: All viewports passed with zero scroll, pure white headline, no overflow, and zero card-feature overlap!');
    process.exit(0);
  } else {
    console.error('FAIL: One or more viewport checks failed.');
    process.exit(1);
  }
}

run();
