/**
 * Email service utilities for handling contact form submissions
 * This file contains SERVER-SIDE ONLY code and is Cloudflare Edge compatible.
 */
import { EmailData } from '@/shared/interfaces/email';

/** Escape user input before interpolating it into the HTML email body. */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Send a contact form email using Resend API
 * This function runs on the server-side only (in API routes or Server Actions)
 */
export async function sendContactEmail(data: EmailData): Promise<boolean> {
    try {
        return await sendWithResend(data);
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

/**
 * Implementation using Resend API (Edge compatible)
 */
async function sendWithResend(data: EmailData): Promise<boolean> {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('RESEND_API_KEY is not set in environment variables');
            return false;
        }

        // All user-supplied values are escaped: the sender controls them.
        const safe = {
            name: escapeHtml(data.name),
            from: escapeHtml(data.from),
            subject: escapeHtml(data.subject),
            message: escapeHtml(data.message).replace(/\r?\n/g, '<br/>'),
        };

        // Format the HTML content for better presentation
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">New Contact Form Submission</h2>

                <div style="margin: 20px 0;">
                <p><strong>From:</strong> ${safe.name} (${safe.from})</p>
                <p><strong>Subject:</strong> ${safe.subject}</p>
                </div>

                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #555;">Message:</h3>
                <div style="line-height: 1.5;">${safe.message}</div>
                </div>

                <div style="font-size: 12px; color: #777; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee;">
                <p>This email was sent from the contact form on your website.</p>
                </div>
            </div>
        `;

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL || 'Contact Form <onboarding@resend.dev>',
                to: [data.to],
                reply_to: data.from,
                subject: `[Contact Form] ${data.subject}`,
                text: `Name: ${data.name}\nEmail: ${data.from}\nSubject: ${data.subject}\n\nMessage:\n${data.message}`,
                html: htmlContent
            })
        });

        if (!response.ok) {
            console.error('Resend API error: HTTP', response.status);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
}
