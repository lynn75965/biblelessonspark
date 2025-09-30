import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { SignupConfirmationEmail } from './_templates/signup-confirmation.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    console.log('Received auth email webhook request')

    // Verify webhook signature if secret is configured
    let webhookData: any
    if (hookSecret) {
      const wh = new Webhook(hookSecret)
      webhookData = wh.verify(payload, headers)
    } else {
      webhookData = JSON.parse(payload)
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = webhookData as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
      }
    }

    console.log(`Sending ${email_action_type} email to ${user.email}`)

    // Determine subject and render appropriate email template based on action type
    let subject = 'Confirm your email'
    let html: string

    switch (email_action_type) {
      case 'signup':
        subject = 'Welcome to LessonSpark USA - Confirm Your Email'
        html = await renderAsync(
          React.createElement(SignupConfirmationEmail, {
            supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
            token_hash,
            email_action_type,
            redirect_to,
            user_email: user.email,
          })
        )
        break
      
      case 'magiclink':
        subject = 'Your LessonSpark USA Login Link'
        html = await renderAsync(
          React.createElement(SignupConfirmationEmail, {
            supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
            token_hash,
            email_action_type,
            redirect_to,
            user_email: user.email,
          })
        )
        break
      
      case 'recovery':
        subject = 'Reset Your LessonSpark USA Password'
        html = await renderAsync(
          React.createElement(SignupConfirmationEmail, {
            supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
            token_hash,
            email_action_type,
            redirect_to,
            user_email: user.email,
          })
        )
        break
      
      default:
        subject = 'LessonSpark USA - Email Verification'
        html = await renderAsync(
          React.createElement(SignupConfirmationEmail, {
            supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
            token_hash,
            email_action_type,
            redirect_to,
            user_email: user.email,
          })
        )
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'LessonSpark USA <onboarding@resend.dev>',
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  } catch (error: any) {
    console.error('Error in send-auth-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Internal server error',
        },
      }),
      {
        status: error.code === 401 ? 401 : 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})
