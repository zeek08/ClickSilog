# Webhook URL Fix

## ❌ Incorrect URL (Current):
```
https://https://us-centra11-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
```

**Problems:**
1. Duplicate `https://` (has `https://https://`)
2. Wrong region: `us-centra11` should be `us-central1` (with letter "l", not number "11")

## ✅ Correct URL:
```
https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
```

## How to Fix:

1. **In PayMongo Dashboard:**
   - Go to **Developers** → **Webhooks**
   - Edit your webhook
   - Change the Endpoint URL to:
     ```
     https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
     ```
   - Make sure there's only ONE `https://` at the beginning
   - Make sure it says `us-central1` (with letter "l", not "11")

2. **Verify the URL:**
   - The URL should start with `https://` (only once)
   - Region: `us-central1` (not `us-centra11`)
   - Project ID: `clicksilog-9a095`
   - Function name: `handlePayMongoWebhook`

## Test the URL:

You can test if the URL is accessible by opening it in a browser:
```
https://us-central1-clicksilog-9a095.cloudfunctions.net/handlePayMongoWebhook
```

It should return an error (since it expects POST, not GET), but that confirms the URL is correct and accessible.

