# Deployment Guide: Lawb.xyz to Cloudflare Pages

## Step 1: Deploy via Cloudflare Pages

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Navigate to your lawb.xyz domain

2. **Access Pages**
   - In the left sidebar, click on "Pages"
   - Click "Create a project"
   - Select "Connect to Git"

3. **Connect GitHub Repository**
   - Choose "GitHub" as your Git provider
   - Authorize Cloudflare to access your GitHub account
   - Select the repository: `wables411/lawb2`
   - Click "Begin setup"

4. **Configure Build Settings**
   - **Project name**: `lawb2` (or any name you prefer)
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)

5. **Environment Variables** (if needed)
   - Add any environment variables your app needs
   - For now, you can leave this empty

6. **Deploy**
   - Click "Save and Deploy"
   - Cloudflare will build and deploy your site

## Step 2: Link Custom Domain

1. **In Cloudflare Pages**
   - Go to your newly created Pages project
   - Click on "Custom domains"
   - Click "Set up a custom domain"

2. **Add Domain**
   - Enter: `lawb.xyz`
   - Click "Continue"
   - Cloudflare will automatically configure the DNS

3. **Verify DNS Settings**
   - Go to DNS settings for lawb.xyz
   - You should see a CNAME record pointing to your Pages deployment
   - The record should look like: `lawb.xyz CNAME your-project.pages.dev`

## Step 3: Update DNS (if needed)

If you need to manually update DNS:

1. **Go to DNS Settings**
   - Visit: https://dash.cloudflare.com/f6fdb849ea97b8d3b8ca3f1afa18b3dd/lawb.xyz/dns/records

2. **Update Records**
   - Remove or update the existing CNAME record pointing to `wables411.github.io`
   - Add new CNAME record:
     - **Name**: `@` (or leave empty for root domain)
     - **Target**: `your-project-name.pages.dev` (from Cloudflare Pages)
     - **Proxy status**: Proxied (orange cloud)

3. **Wait for Propagation**
   - DNS changes can take up to 24 hours
   - Usually much faster with Cloudflare

## Step 4: Verify Deployment

1. **Check Build Status**
   - In Cloudflare Pages, monitor the build process
   - Ensure build completes successfully

2. **Test the Site**
   - Visit: https://lawb.xyz
   - Verify all features work correctly

## Alternative: GitHub Pages (if Cloudflare Pages doesn't work)

If you prefer to use GitHub Pages:

1. **Enable GitHub Pages**
   - Go to your repository: https://github.com/wables411/lawb2
   - Go to Settings > Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)

2. **Update DNS**
   - Add CNAME record pointing to `wables411.github.io`

## Troubleshooting

- **Build Failures**: Check the build logs in Cloudflare Pages
- **DNS Issues**: Ensure CNAME records are correct
- **Large Files**: Consider using Git LFS for large media files
- **Environment Variables**: Add any required API keys or configuration

## Next Steps

After deployment:
1. Test all functionality
2. Monitor performance
3. Set up any additional Cloudflare features (caching, security, etc.) 