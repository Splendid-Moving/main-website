# API Functions - Beginner's Guide

## What's in this folder?

This folder contains **serverless functions** that run on Vercel's servers. Think of them as small backend programs that handle tasks like submitting forms to your CRM.

## How does it work?

### The Simple Explanation
When someone fills out the quote form on your website:
1. They click "Submit"
2. JavaScript sends the form data to `/api/submit-quote`
3. Vercel runs the code in `submit-quote.js` on their servers
4. That code creates a new contact in your GoHighLevel CRM
5. The website shows a success message

### Why Serverless?
- **No server management**: You don't need to rent or maintain a server
- **Auto-scaling**: Handles 1 or 1000 requests automatically
- **Pay per use**: Only charged when functions run (Vercel's free tier is generous)

## File Structure

```
/api
  ├── submit-quote.js    # Handles quote form submissions
  └── README.md          # This file
```

## How Vercel Deploys This

When you deploy to Vercel:
1. Vercel detects the `/api` folder
2. Each `.js` file becomes an API endpoint
3. `submit-quote.js` → accessible at `https://yourdomain.com/api/submit-quote`

No configuration needed! Vercel does this automatically.

## The Quote Submission Flow

### Step-by-Step Process

```
User fills form → Browser sends data → Vercel function → GoHighLevel CRM
                                    ↓
                                Success/Error response
                                    ↓
                           Website shows result
```

### What `submit-quote.js` does:

1. **Validates the request**
   - Only accepts POST requests
   - Checks for required fields (name, email, phone)

2. **Prepares the data**
   - Maps form fields to GHL contact fields
   - Adds move size as a tag
   - Stores addresses and move date as custom fields

3. **Sends to GoHighLevel**
   - Makes authenticated API call
   - Uses your API token from environment variables
   - Creates or updates the contact

4. **Returns response**
   - Success: Contact created ✅
   - Error: Tells you what went wrong ❌

## Environment Variables (Important!)

The function needs these secrets to work:

- `GHL_ACCESS_TOKEN` - Your GoHighLevel API token
- `GHL_LOCATION_ID` - Your GHL sub-account ID

### Where these come from:
1. **Locally**: From `.env` file (already configured)
2. **On Vercel**: You'll add them in the Vercel dashboard

### How to add them to Vercel:
1. Go to your project on vercel.com
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - Name: `GHL_ACCESS_TOKEN`
   - Value: (paste your token from `.env`)
   - Click "Add"
4. Repeat for `GHL_LOCATION_ID`
5. Redeploy your site

## Testing Locally

You can test the API function on your computer before deploying:

### Install Vercel CLI:
```bash
npm install -g vercel
```

### Run development server:
```bash
vercel dev
```

This starts a local server at `http://localhost:3000` where:
- Your website works at `http://localhost:3000`
- The API is at `http://localhost:3000/api/submit-quote`

### Test the form:
1. Fill out the quote form
2. Click submit
3. Check your GoHighLevel account for the new contact

## Common Issues & Solutions

### ❌ "Missing API credentials" error
**Problem**: Environment variables not set  
**Solution**: Make sure `.env` file exists locally, or check Vercel dashboard settings

### ❌ Form submission fails silently
**Problem**: JavaScript can't reach the API  
**Solution**: Check browser console (F12) for errors, verify the API path

### ❌ Contact not appearing in GHL
**Problem**: API token might be invalid or expired  
**Solution**: Verify your token in GoHighLevel settings, update `.env` if needed

### ❌ CORS errors in browser
**Problem**: Cross-origin restrictions  
**Solution**: Update `Access-Control-Allow-Origin` in `submit-quote.js` to your domain

## Security Notes

✅ **What's secure:**
- API tokens stored as environment variables (never in code)
- Server-side validation of all inputs
- HTTPS enforced by Vercel

⚠️ **What to remember:**
- Never commit `.env` to git (it's in `.gitignore`)
- Never share your API tokens
- Rotate tokens if accidentally exposed

## Debugging Tips

### Check function logs:
1. Go to vercel.com → Your Project → Functions
2. Click on `submit-quote`
3. View real-time logs to see what's happening

### Test API directly:
Use a tool like Postman or curl:

```bash
curl -X POST https://yourdomain.com/api/submit-quote \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890",
    "email": "test@example.com",
    "moveSize": "Studio"
  }'
```

## Need Help?

**Vercel Documentation:**
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

**GoHighLevel API:**
- [API Documentation](https://marketplace.gohighlevel.com/docs/)
- [Create Contact Endpoint](https://highlevel.stoplight.io/docs/integrations/9d0e2b2885a33-create-contact)

**Common Questions:**
- "Do I need Node.js installed?" → No, Vercel handles everything
- "How much does this cost?" → Free tier covers most small businesses
- "Can I modify the function?" → Yes! Edit `submit-quote.js` and redeploy
