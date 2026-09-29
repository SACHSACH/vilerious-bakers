# Vilerious Bakers - Gallery Upload Setup Guide

You now have an image/video gallery system with admin upload functionality!

## Two Ways to Use the Gallery

### Option 1: LocalStorage (No Setup Required - Quick Testing)
The gallery works immediately with browser LocalStorage. Images/videos uploaded are stored locally in your browser only.

- **Admin Password:** `vilerious2024`
- **How to test:** Navigate to `#admin` section, enter password, upload images/videos
- **Limitation:** Data only persists in your browser; won't sync across devices

### Option 2: Supabase (Recommended for Production)
Set up free Supabase to store images/videos in the cloud and sync across devices.

## Setting Up Supabase (Free)

1. **Create a Supabase account:**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up with email or GitHub
   - Create a new project (free tier available)

2. **Create a database table:**
   - In Supabase dashboard, go to **SQL Editor**
   - Run this query:
   ```sql
   CREATE TABLE cakes (
     id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
     name TEXT NOT NULL,
     description TEXT,
     media_url TEXT NOT NULL,
     media_type TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Create storage bucket:**
   - Go to **Storage** in Supabase
   - Create a bucket named `cakes`
   - Set it to public (allow public file access)

4. **Get your credentials:**
   - Go to **Settings > API**
   - Copy your `Project URL` and `Anon Key`

5. **Update your site's `config.js`:**
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_KEY = 'your-anon-key-here';
   const ADMIN_PASSWORD = 'vilerious2024'; // Change to a strong password
   ```

6. **Commit and push to GitHub:**
   ```bash
   git add config.js
   git commit -m "Configure Supabase credentials"
   git push
   ```

## Using the Admin Panel

1. Scroll to the **Admin Panel** section at the bottom of the site
2. Enter the admin password
3. Fill in cake details (name, description)
4. Upload an image or video (max 50MB)
5. Click "Upload to Gallery"
6. The cake will appear in the gallery immediately!

## Security Notes

- **Change the admin password** in `config.js` to something only you know
- **Keep your Supabase URL and key private** – don't commit them to GitHub publicly
- If you accidentally expose credentials, regenerate them in Supabase settings
- Supabase free tier includes 500MB storage and 2GB bandwidth/month

## Supported Formats

- **Images:** JPG, PNG, WebP, GIF
- **Videos:** MP4, WebM
- **Max file size:** 50MB

## Troubleshooting

- **Gallery not loading?** Check browser console (F12 → Console) for errors
- **Upload fails?** Make sure your Supabase bucket is public and credentials are correct
- **Password not working?** Verify the exact password in `config.js`

## File Size Tips

- Resize images to ~1200px width before uploading (faster loading)
- Compress videos to ~5-10MB (use tools like HandBrake or FFmpeg)
- Larger files = slower gallery for visitors on mobile

## Next Steps

- Customize `ADMIN_PASSWORD` in `config.js`
- Add more styles to `.gallery-item` in `styles.css` if you want custom gallery look
- Set up a domain (you started this earlier with DigitalPlat)

Questions? Check [Supabase docs](https://supabase.com/docs) for cloud storage setup.
