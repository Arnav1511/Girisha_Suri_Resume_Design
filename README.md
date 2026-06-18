# Girisha Suri Portfolio

## Run locally

Requires Node.js 20 or newer.

```powershell
$env:GEMINI_API_KEY="your-key"
npm start
```

Open `http://localhost:3000`. The portfolio works without an API key; only the AI Studio requires it.

## Deploy on Replit

1. Import this repository into Replit.
2. Open **Secrets** and add `GEMINI_API_KEY`. Never place the key in `cv.html` or commit it.
3. Run the Repl and confirm the portfolio and AI Studio work.
4. Create a **Reserved VM** or **Autoscale** deployment. A static deployment will not work because the protected AI endpoints require `server.js`.
5. In the deployment settings, choose **Link a domain** and enter the domain or subdomain you own.

Optional secrets can override the default models:

- `GEMINI_CHAT_MODEL` (default: `gemini-2.5-flash`)
- `GEMINI_IMAGE_MODEL` (default: `gemini-2.5-flash-image`)

## Connect a GoDaddy domain

Replit shows the DNS records required for the specific deployment. Use those displayed values rather than guessing an IP address.

1. In GoDaddy, open **My Products**, select the domain, then open **DNS**.
2. Add exactly the record(s) Replit shows. For `www`, this is commonly a CNAME: set **Name** to `www` and **Value** to the Replit target.
3. If Replit requests a verification TXT record, add it as shown.
4. Remove any old GoDaddy record that conflicts with the same host (`www` or `@`). Do not remove email-related MX/TXT records.
5. Return to Replit and verify the domain. DNS and HTTPS provisioning can take time.
6. For a root/apex domain, use the exact A/ALIAS records Replit provides. A simple alternative is to attach `www.yourdomain.com` to Replit and forward the root domain to `https://www.yourdomain.com` in GoDaddy.

After launch, test both `https://yourdomain.com` and `https://www.yourdomain.com`, including the contact links and both AI Studio tools.
