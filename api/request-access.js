// This Vercel serverless function includes robust checking of the Resend API call.
import { Resend } from 'resend';
import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
  // --- Standard CORS and Method Check ---
  const allowedOrigins = [
    'https://rahulkumareconomist-github-io.vercel.app',
    'https://rahulkumareconomist.github.io'
  ];
  const origin = request.headers.origin;
  if (allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Only POST requests are allowed' });
  }

  // Check for all required Environment Variables FIRST
  const { RESEND_API_KEY, NOTIFICATION_EMAIL, KV_REST_API_URL, KV_REST_API_TOKEN } = process.env;
  if (!RESEND_API_KEY || !NOTIFICATION_EMAIL || !KV_REST_API_URL || !KV_REST_API_TOKEN) {
      console.error("Server Configuration Error: Missing one or more environment variables.");
      return response.status(500).json({ error: 'Server is not configured correctly. Please contact the administrator.' });
  }

  try {
    const { name, company, email } = request.body;
    if (!name || !company || !email) {
      return response.status(400).json({ error: 'Missing required fields.' });
    }

    // --- Token Generation Logic ---
    const token = crypto.randomUUID().slice(0, 13).replace(/-/g, '').match(/.{1,4}/g).join('-');
    const kv = createClient({
      url: KV_REST_API_URL,
      token: KV_REST_API_TOKEN,
    });
    await kv.set(token, 'valid', { ex: 86400 });

    // --- Email Notification Logic ---
    const resend = new Resend(RESEND_API_KEY);
    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;

    const subject = `[Action Required] Resume Access Request from ${name}`;
    const body = `
      <p>You have received a new request to access confidential details on your resume.</p>
      <h3 style="color:#333;">Requester Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Company:</strong> ${company}</li>
        <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
        <li><strong>IP Address:</strong> ${ip}</li>
      </ul>
      <h3 style="color:#333;">Single-Use Access Token:</h3>
      <p>If you approve this request, please forward the following token to them. It is valid for 24 hours and can only be used once.</p>
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 2px; background-color: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">${token}</p>
    `;

    // Send the single, comprehensive email to yourself and check the response
    const { data, error } = await resend.emails.send({
        from: 'Portfolio Notifier <onboarding@resend.dev>',
        to: NOTIFICATION_EMAIL,
        subject: subject,
        html: body,
    });

    // **CRITICAL CHECK:** If there's an error from Resend, throw an error to be caught by the catch block.
    if (error) {
      console.error("Resend API Error:", error);
      throw new Error("Failed to send notification email via Resend.");
    }
    
    // Only if there is no error, log success and return a success response
    console.log(`Token ${token} generated for ${email} and notification sent successfully. Message ID: ${data.id}`);
    return response.status(200).json({ success: true });

  } catch (error) {
    console.error('Access Request Error:', error);
    return response.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
}
