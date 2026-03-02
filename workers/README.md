# SoundCloud API Worker

Cloudflare Worker that replaces Netlify `soundcloud-likes` and `soundcloud-stream` functions. **Zero Netlify credits** for SoundCloud traffic.

## Deploy

```bash
cd workers
npx wrangler login   # one-time: authenticate with Cloudflare
npx wrangler deploy
```

After deploy, the Worker will be at `https://lawb-soundcloud-api.wablesphoto.workers.dev`.

## Verify

```bash
curl "https://lawb-soundcloud-api.wablesphoto.workers.dev/soundcloud-likes?profileUrl=https://soundcloud.com/companioncube143"
```

## Frontend

The lawb.xyz build uses `VITE_SOUNDCLOUD_API_BASE` (set in netlify.toml) so the frontend calls this Worker instead of Netlify. No Netlify function invocations for SoundCloud.
