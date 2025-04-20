
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Question {
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
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

    const { data: settings, error: settingsError } = await supabase
      .from('user_api_settings')
      .select('openai_api_key, anthropic_api_key, gemini_api_key')
      .eq('user_id', user.id)
      .single()

    if (settingsError) {
      throw new Error('Error fetching API settings')
    }

    const { topic, difficulty, provider } = await req.json()

    let questions: Question[] = []

    switch (provider) {
      case 'openai':
        if (!settings?.openai_api_key) throw new Error('OpenAI API key not found')
        questions = await generateOpenAIQuestions(settings.openai_api_key, topic, difficulty)
        break
      case 'anthropic':
        if (!settings?.anthropic_api_key) throw new Error('Anthropic API key not found')
        questions = await generateAnthropicQuestions(settings.anthropic_api_key, topic, difficulty)
        break
      case 'gemini':
        if (!settings?.gemini_api_key) throw new Error('Gemini API key not found')
        questions = await generateGeminiQuestions(settings.gemini_api_key, topic, difficulty)
        break
      default:
        throw new Error('Invalid AI provider')
    }

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

async function generateOpenAIQuestions(apiKey: string, topic: string, difficulty: string): Promise<Question[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
  return JSON.parse(data.choices[0].message.content)
}

async function generateAnthropicQuestions(apiKey: string, topic: string, difficulty: string): Promise<Question[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Generate 100 multiple choice questions about ${topic}. Each question should have 4 options and be of ${difficulty} difficulty. Format the response as a JSON array with this structure: [{ text: string, options: string[], correctAnswer: string, difficulty: 'easy' | 'medium' | 'hard' }]. Return only the JSON array.`
      }]
    })
  });

  const data = await response.json()
  return JSON.parse(data.content[0].text)
}

async function generateGeminiQuestions(apiKey: string, topic: string, difficulty: string): Promise<Question[]> {
  const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Generate 100 multiple choice questions about ${topic}. Each question should have 4 options and be of ${difficulty} difficulty. Format the response as a JSON array with this structure: [{ text: string, options: string[], correctAnswer: string, difficulty: 'easy' | 'medium' | 'hard' }]. Return only the JSON array.`
        }]
      }]
    })
  });

  const data = await response.json()
  return JSON.parse(data.candidates[0].content.parts[0].text)
}
