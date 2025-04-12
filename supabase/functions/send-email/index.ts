
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  name?: string;
  action?: string;
  template?: string;
  html?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, name, action, template, html } = await req.json() as EmailRequest;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Default HTML if none is provided
    let emailHtml = html || `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5CF6; margin-top: 40px; margin-bottom: 20px;">TrivTap</h1>
        <p style="margin-bottom: 16px;">Hello${name ? ` ${name}` : ''},</p>
        <p style="margin-bottom: 16px;">Thank you for using TrivTap!</p>
        ${action ? `<p style="margin-bottom: 16px;">${action}</p>` : ''}
        <p style="margin-bottom: 16px;">Best regards,<br/>The TrivTap Team</p>
      </div>
    `;

    // Handle different email templates
    if (template === "welcome") {
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8B5CF6; margin-top: 40px; margin-bottom: 20px;">Welcome to TrivTap!</h1>
          <p style="margin-bottom: 16px;">Hello ${name || 'there'},</p>
          <p style="margin-bottom: 16px;">Thank you for signing up! We're excited to have you join our community of trivia hosts and players.</p>
          <p style="margin-bottom: 16px;">With TrivTap, you can:</p>
          <ul style="margin-bottom: 16px;">
            <li>Create engaging trivia games for your venue</li>
            <li>Let players join easily using their mobile devices</li>
            <li>Keep your audience entertained with auto-running questions</li>
          </ul>
          <p style="margin-bottom: 16px;">If you have any questions, feel free to reply to this email or contact our support team.</p>
          <p style="margin-bottom: 16px;">Best regards,<br/>The TrivTap Team</p>
        </div>
      `;
    } else if (template === "verification") {
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8B5CF6; margin-top: 40px; margin-bottom: 20px;">Verify Your Email</h1>
          <p style="margin-bottom: 16px;">Hello ${name || 'there'},</p>
          <p style="margin-bottom: 16px;">Please verify your email address by clicking the link below:</p>
          <p style="margin-bottom: 24px;">
            <a href="${action}" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p style="margin-bottom: 16px;">If you did not sign up for TrivTap, please ignore this email.</p>
          <p style="margin-bottom: 16px;">Best regards,<br/>The TrivTap Team</p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "TrivTap <notifications@trivtap.com>",
      to: [to],
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
