# Typeform-Style Application Form

A beautiful, Typeform-inspired application form that collects responses and emails them directly to you.

## Features

- Typeform-style smooth transitions and animations
- "Wind wash" entrance animation
- 6-step sequential form with progress indicator
- Geolocation capture (with user permission)
- IP address detection
- VPN/Proxy detection
- Automatic email delivery via Resend
- Fully responsive design
- Keyboard navigation support

## Setup Instructions

### 1. Install Dependencies

```bash
cd typeform-app
npm install
```

### 2. Configure Resend API Key

1. Go to [https://resend.com](https://resend.com) and create a free account
2. Navigate to API Keys and create a new key
3. Create a `.env.local` file in the project root:

```bash
RESEND_API_KEY=re_your_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the form.

## Deploy to Vercel

### Option 1: Deploy with Vercel CLI

```bash
npm i -g vercel
vercel
```

When prompted, add your environment variable:
- `RESEND_API_KEY`: Your Resend API key

### Option 2: Deploy via GitHub

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add the environment variable `RESEND_API_KEY` in the Vercel dashboard
4. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Your Resend API key for sending emails |

## Email Recipient

All submissions are sent to: **shaidt137@gmail.com**

To change the recipient email, edit `src/app/api/submit/route.ts` and update the `to` field in the `resend.emails.send()` call.

## Customizing Questions

Edit `src/lib/types.ts` to modify the form questions. Each question has:
- `id`: Unique identifier
- `number`: Display number
- `question`: The question text
- `subtext`: Optional helper text
- `type`: Input type (text, email, textarea, etc.)
- `placeholder`: Input placeholder text
- `required`: Whether the field is required

## Important Notes

- **Resend Free Tier**: The free tier allows 100 emails/day and 3,000 emails/month
- **Domain Verification**: For production, verify your own domain in Resend to use a custom sender address
- **Geolocation**: Users must grant permission for precise location; IP-based location is used as fallback
- **VPN Detection**: Uses IP-based heuristics to detect common VPN/proxy providers
