# Add DNS A Record in Netlify

## Steps

1. **Go to Netlify Dashboard**
   - https://app.netlify.com
   - Log in

2. **Find Your Site**
   - Click on the site for `lawb.xyz`

3. **Go to DNS Settings**
   - Click **"Domain settings"** (or **"DNS"** in the left sidebar)
   - Or go to: Site → **Domain management** → **DNS**

4. **Add A Record**
   - Click **"Add record"** or **"Add DNS record"**
   - Select **"A"** as the record type
   - **Hostname:** `chess`
   - **Value:** `107.170.71.63`
   - Click **Save**

5. **Verify**
   - You should see a new record:
     ```
     Type: A
     Hostname: chess
     Value: 107.170.71.63
     ```

6. **Wait 5-15 minutes** for DNS propagation

7. **Test**
   ```bash
   dig chess.lawb.xyz
   curl https://chess.lawb.xyz/api/stockfish
   ```

That's it! Once DNS propagates, `chess.lawb.xyz` will point to your DigitalOcean droplet.

