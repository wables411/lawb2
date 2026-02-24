import OBSWebSocket from 'obs-websocket-js';

function buildAsciiEqDataUrl() {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin:0; width:100%; height:100%; background:#000; overflow:hidden; }
    body { font:16px/1.1 Consolas, "Courier New", monospace; color:#00ff66; }
    #wrap { box-sizing:border-box; width:100%; height:100%; padding:16px 18px; border:2px solid #00aa44; }
    #title { color:#b3ffd1; margin-bottom:8px; }
    #eq { white-space:pre; }
    #footer { position:absolute; left:18px; bottom:10px; color:#66ff99; opacity:.9; }
  </style>
</head>
<body>
  <div id="wrap">
    <div id="title">LAWBAMP ASCII EQ :: STREAM MODE</div>
    <div id="eq"></div>
    <div id="footer">there is no meme i lawb you</div>
  </div>
  <script>
    const eq = document.getElementById('eq');
    const bars = 28;
    const h = 10;
    const chars = [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'];
    function frame(t) {
      const time = t / 1000;
      const vals = Array.from({ length: bars }, (_, i) =>
        Math.max(0, Math.min(1,
          0.1 + 0.45 * Math.abs(Math.sin(time * 1.8 + i * 0.37)) +
          0.35 * Math.abs(Math.sin(time * 3.2 + i * 0.19))
        ))
      );
      const lines = [];
      for (let y = h; y >= 1; y--) {
        let line = '';
        for (let i = 0; i < bars; i++) {
          const level = Math.round(vals[i] * h);
          if (level >= y) {
            const cIdx = Math.min(chars.length - 1, Math.max(1, Math.round((level / h) * (chars.length - 1))));
            line += chars[cIdx] + chars[cIdx];
          } else {
            line += '  ';
          }
        }
        lines.push(line);
      }
      lines.push('~'.repeat(bars * 2));
      eq.textContent = lines.join('\\n');
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  </script>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}&r=${Date.now()}`;
}

async function main() {
  const obs = new OBSWebSocket();
  await obs.connect(process.env.OBS_WS_URL || 'ws://192.168.1.71:4455', process.env.OBS_WS_PASSWORD || 'dAGTYF8nEclhqobR');

  const sceneName = 'Clawb World';
  const audioSource = 'Lawbamp Audio';
  const audioUrl = `https://lawb.xyz/?stream=1&autoplay=1&openPlayer=1&r=${Date.now()}`;
  const eqSource = 'Lawbamp ASCII EQ';
  const eqUrl = buildAsciiEqDataUrl();

  try {
    await obs.call('CreateInput', {
      sceneName,
      inputName: audioSource,
      inputKind: 'browser_source',
      inputSettings: { url: audioUrl, width: 16, height: 16, reroute_audio: true, restart_when_active: false, shutdown: false },
      sceneItemEnabled: true,
    });
  } catch {}

  await obs.call('SetInputSettings', {
    inputName: audioSource,
    inputSettings: { url: audioUrl, width: 16, height: 16, reroute_audio: true, restart_when_active: false, shutdown: false },
    overlay: true,
  });
  const audioItem = await obs.call('GetSceneItemId', { sceneName, sourceName: audioSource });
  await obs.call('SetSceneItemTransform', {
    sceneName,
    sceneItemId: audioItem.sceneItemId,
    sceneItemTransform: { positionX: -2000, positionY: -2000, boundsWidth: 16, boundsHeight: 16 },
  }).catch(() => {});
  await obs.call('SetSceneItemEnabled', { sceneName, sceneItemId: audioItem.sceneItemId, sceneItemEnabled: true });

  try {
    await obs.call('CreateInput', {
      sceneName,
      inputName: eqSource,
      inputKind: 'browser_source',
      inputSettings: { url: eqUrl, width: 640, height: 360, reroute_audio: false, restart_when_active: false, shutdown: false },
      sceneItemEnabled: true,
    });
  } catch {}

  await obs.call('SetInputSettings', {
    inputName: eqSource,
    inputSettings: { url: eqUrl, width: 640, height: 360, reroute_audio: false, restart_when_active: false, shutdown: false },
    overlay: true,
  });
  const eqItem = await obs.call('GetSceneItemId', { sceneName, sourceName: eqSource });
  await obs.call('SetSceneItemTransform', {
    sceneName,
    sceneItemId: eqItem.sceneItemId,
    sceneItemTransform: { positionX: 1260, positionY: 700, boundsWidth: 640, boundsHeight: 360 },
  }).catch(() => {});
  await obs.call('SetSceneItemEnabled', { sceneName, sceneItemId: eqItem.sceneItemId, sceneItemEnabled: true });

  for (const old of ['Lawbamp Overlay']) {
    try {
      const oldItem = await obs.call('GetSceneItemId', { sceneName, sourceName: old });
      await obs.call('SetSceneItemEnabled', { sceneName, sceneItemId: oldItem.sceneItemId, sceneItemEnabled: false });
    } catch {}
  }

  console.log('Applied Lawbamp ASCII EQ overlay + hidden audio source.');
  obs.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
