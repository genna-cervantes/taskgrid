# GitHub Integration Setup

This guide explains how to set up GitHub App integration for your project.

## Required Environment Variables

Add these to your `.env` file in the `server` directory:

```env
# GitHub App Configuration
GITHUB_APP_ID=your_app_id_here
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYour private key here...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
```

## GitHub App Setup Steps

### 1. Create a GitHub App

1. Go to GitHub Settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Fill in the basic information:
   - **App name**: Your app name (e.g., "Taskan Integration")
   - **Homepage URL**: `https://yourdomain.com` or `http://localhost:5173` for development
   - **Callback URL**: `https://yourdomain.com/github/callback` or `http://localhost:3000/github/callback` for development
   - **Webhook URL**: `https://yourdomain.com/webhooks/github` or use ngrok for local development
   - **Webhook secret**: Generate a secure random string

### 2. Set Permissions

Set these permissions for your GitHub App:
- **Repository permissions**:
  - Issues: Read & Write
  - Pull requests: Read & Write
  - Contents: Read (if you need to read repository files)
  - Metadata: Read

- **Subscribe to events**:
  - Installation
  - Issues
  - Pull request
  - Push (if needed)

### 3. Get Configuration Values

After creating the app:
1. **App ID**: Found on the app's settings page
2. **Private Key**: Generate and download from the app's settings page
3. **Webhook Secret**: The secret you set during creation

### 4. Environment Setup

1. Copy the App ID to `GITHUB_APP_ID`
2. Copy the entire private key content to `GITHUB_PRIVATE_KEY` (including the BEGIN/END lines)
3. Copy your webhook secret to `GITHUB_WEBHOOK_SECRET`

### 5. Local Development with ngrok

For local development, you need to expose your local server to the internet:

```bash
# Install ngrok if you haven't already
npm install -g ngrok

# Expose your local server
ngrok http 3000
```

Then update your GitHub App's webhook URL to the ngrok URL: `https://your-ngrok-url.ngrok.io/webhooks/github`

## Testing the Integration

1. Install your GitHub App on a repository
2. Check your server logs for:
   - Installation webhook events
   - Callback URL hits
3. Verify the installation appears in your app's installations page

## Common Issues

### Webhook not receiving events
- Check that your webhook URL is publicly accessible
- Verify the webhook secret matches your environment variable
- Check GitHub's webhook delivery logs for error details

### Callback URL not working
- Ensure the callback URL matches exactly what's configured in your GitHub App
- Check that your server is running and accessible
- Verify the middleware order in your Express app

### JWT/Authentication errors
- Ensure your private key is properly formatted with newlines
- Check that your App ID is correct
- Verify the private key belongs to the correct GitHub App
