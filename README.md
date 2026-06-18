# Girisha Suri Portfolio

This is a fully static portfolio. It needs no API key, backend, Node server, or secrets.

## Deploy on Replit

1. Import this folder or repository into Replit.
2. Create a **Static Deployment**.
3. Set the public directory to `.` if Replit asks for it.
4. Deploy and confirm the Replit URL opens the portfolio.
5. Open the deployment's **Custom domain** or **Link a domain** option and enter the GoDaddy domain.

Replit will show the DNS records for that particular deployment.

## Connect GoDaddy DNS

1. In GoDaddy, open **My Products**, select the domain, and open **DNS**.
2. Edit or add the **A** record requested by Replit. For the root domain, the Name/Host is normally `@`. Paste the exact IP address Replit displays into **Value/Points to**.
3. Add Replit's verification **TXT** record if it displays one.
4. For `www`, add the CNAME Replit requests, or forward `www` to the root domain if that is the setup you prefer.
5. Remove only records that conflict on the same host. Do not remove email MX or email-verification TXT records.
6. Return to Replit and click **Verify**. DNS and HTTPS activation may take some time.

GoDaddy provides the domain and DNS; the website itself remains hosted by the Replit Static Deployment.
