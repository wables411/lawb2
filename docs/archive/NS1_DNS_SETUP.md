# Setting Up DNS A Record in NS1 (nsone.net)

Since you're using NS1 nameservers, you need to add the DNS record in the NS1 dashboard.

## Steps

### 1. Log into NS1
- Go to https://my.nsone.net (or your NS1 dashboard URL)
- Log in with your NS1 account

### 2. Find Your Zone
- Navigate to **Zones** or **DNS**
- Find and click on the zone: **`lawb.xyz`**

### 3. Add A Record for chess.lawb.xyz

Click **"Add Record"** or **"+"** and configure:

**Record Type:** `A`  
**Host/Name:** `chess` (or `chess.lawb.xyz` - depends on NS1 interface)  
**Answer/Value:** `107.170.71.63`  
**TTL:** `3600` (or default)

**Note:** 
- If NS1 asks for just the hostname, enter: `chess`
- If it asks for the full domain, enter: `chess.lawb.xyz`
- The final result should make `chess.lawb.xyz` resolve to `107.170.71.63`

### 4. Save the Record

Click **Save** or **Add Record**

### 5. Verify in NS1

After adding, you should see:
```
Type: A
Host: chess
Answer: 107.170.71.63
TTL: 3600
```

### 6. Wait for Propagation

NS1 usually propagates quickly (5-15 minutes), but can take up to 60 minutes.

### 7. Test DNS Resolution

After a few minutes, test from your local machine:

```bash
# Test DNS resolution
dig chess.lawb.xyz
# Should show: 107.170.71.63

# Or
nslookup chess.lawb.xyz
# Should show: 107.170.71.63

# Test the API
curl https://chess.lawb.xyz/api/stockfish
# Should return: {"status":"Stockfish API is running"}
```

## NS1 Dashboard Screenshots Guide

If you're having trouble finding where to add the record:

1. **Main Dashboard** → Click **"Zones"** or **"DNS"**
2. Click on **`lawb.xyz`** zone
3. You should see existing records (like `@` for the root domain)
4. Click **"Add Record"** or **"+"** button
5. Select **"A"** as the record type
6. Enter:
   - **Host:** `chess`
   - **Answer:** `107.170.71.63`
   - **TTL:** `3600`
7. Click **Save**

## Troubleshooting

**If you can't find the zone:**
- Make sure you're logged into the correct NS1 account
- Check if the zone was created automatically or needs to be created

**If the record doesn't appear:**
- NS1 may have a slight delay (1-2 minutes) before the record is active
- Check the record was saved correctly

**If DNS still doesn't resolve after 30 minutes:**
- Double-check the record is correct in NS1 dashboard
- Verify the IP is exactly: `107.170.71.63`
- Try clearing your DNS cache: `sudo dscacheutil -flushcache` (Mac) or `ipconfig /flushdns` (Windows)

## Once DNS is Working

After DNS propagates, your chess app will be able to:
- ✅ Call `https://chess.lawb.xyz/api/stockfish` for hard mode
- ✅ No more `ERR_NAME_NOT_RESOLVED` errors
- ✅ Hard mode will work perfectly!

Let me know once you've added the record and we can test it!

