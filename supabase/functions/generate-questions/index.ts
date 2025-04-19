
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (userError || !user) {
      throw new Error('Invalid token')
    }

    // Get user's API key
    const { data: settings, error: settingsError } = await supabase
      .from('user_api_settings')
      .select('openai_api_key')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !settings?.openai_api_key) {
      throw new Error('OpenAI API key not found')
    }

    const { topic, difficulty } = await req.json()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are a helpful assistant that generates multiple-choice trivia questions. Generate questions in JSON format with the following structure: [{ text: string, options: string[], correctAnswer: string, difficulty: 'easy' | 'medium' | 'hard' }]"
        }, {
          role: "user",
          content: `Generate 100 multiple choice questions about ${topic}. Each question should have 4 options and be of ${difficulty} difficulty. Return only the JSON array.`
        }],
        temperature: 0.7
      })
    });

    const data = await response.json()
    const questions = JSON.parse(data.choices[0].message.content)

    return new Response(JSON.stringify(questions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
