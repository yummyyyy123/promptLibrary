-- Supabase Database Schema for Prompt Library
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  prompt TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  prompt TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_tags ON submissions USING GIN(tags);

-- Insert sample data (optional)
INSERT INTO prompts (title, description, category, tags, prompt, variables) VALUES
(
  'Product Launch Email Campaign',
  'Create a compelling email sequence to announce your new product launch',
  'Marketing',
  ARRAY['email', 'launch', 'product'],
  'Write a 3-email sequence for launching [Product Name].

Email 1: Teaser email (7 days before launch)
- Subject: Something big is coming...
- Build anticipation without revealing the product
- Hint at the problem it solves

Email 2: Pre-launch announcement (3 days before launch)
- Subject: Get ready to transform [Target Audience]''s [Pain Point]
- Reveal the product name and key benefit
- Include early bird offer details

Email 3: Launch day
- Subject: [Product Name] is now live! 🎉
- Clear call-to-action to purchase
- Include social proof/testimonials
- Create urgency with limited-time offer

Target audience: [Target Audience Description]
Brand voice: [Brand Voice Guidelines]
Key differentiator: [What makes this product unique]',
  ARRAY['Product Name', 'Target Audience', 'Pain Point', 'Target Audience Description', 'Brand Voice Guidelines', 'What makes this product unique']
),
(
  'Business SWOT Analysis',
  'Comprehensive SWOT analysis template for strategic business planning',
  'Business Operations',
  ARRAY['strategy', 'planning', 'analysis'],
  'Conduct a comprehensive SWOT analysis for [Company Name] in the [Industry] industry.

STRENGTHS (Internal, Positive):
- What are our core competencies?
- What unique resources do we have?
- What do customers perceive as our strengths?
- What advantages do we have over competitors?
- Financial strengths: [Financial Metrics]
- Team strengths: [Team Capabilities]

WEAKNESSES (Internal, Negative):
- What areas need improvement?
- What resources are we lacking?
- What do customers complain about?
- Where are we vulnerable?
- Operational gaps: [Operational Issues]
- Skill gaps: [Skill Deficiencies]

OPPORTUNITIES (External, Positive):
- What market trends can we leverage?
- What technological changes benefit us?
- What regulatory changes help us?
- Market gaps: [Market Opportunities]
- Partnership possibilities: [Potential Partners]

THREATS (External, Negative):
- What obstacles do we face?
- Who are our emerging competitors?
- What technological changes threaten us?
- Market challenges: [Market Threats]
- Regulatory risks: [Regulatory Concerns]

Based on this analysis, recommend 3 strategic priorities for the next [Time Period].',
  ARRAY['Company Name', 'Industry', 'Financial Metrics', 'Team Capabilities', 'Operational Issues', 'Skill Deficiencies', 'Market Opportunities', 'Potential Partners', 'Market Threats', 'Regulatory Concerns', 'Time Period']
),
(
  'LinkedIn Thought Leadership Post',
  'Create engaging LinkedIn posts to establish thought leadership in your industry',
  'Social Media',
  ARRAY['linkedin', 'thought leadership', 'professional'],
  'Write a LinkedIn thought leadership post about [Topic] for [Your Role/Title].

Structure:
1. HOOK (first 2 lines): Start with a surprising statistic, provocative question, or relatable pain point about [Topic]

2. CONTEXT: Briefly explain why this matters to [Target Audience] right now

3. INSIGHT: Share your unique perspective or framework about [Topic]. Include:
   - Personal experience or case study: [Specific Example]
   - Data point or research: [Supporting Data]
   - Contrarian view or fresh angle: [Unique Take]

4. ACTIONABLE TAKEAWAY: Give 2-3 practical tips readers can implement:
   • Tip 1: [First Actionable Tip]
   • Tip 2: [Second Actionable Tip]
   • Tip 3: [Third Actionable Tip]

5. ENGAGEMENT: End with a question to encourage comments:
"What''s your experience with [Topic]? Share in the comments 👇"

Hashtags: ##[Relevant Hashtag 1] ##[Relevant Hashtag 2] ##[Relevant Hashtag 3]

Tone: [Desired Tone - e.g., authoritative, conversational, inspiring]
Length: Keep under 1500 characters for optimal engagement',
  ARRAY['Topic', 'Your Role/Title', 'Target Audience', 'Specific Example', 'Supporting Data', 'Unique Take', 'First Actionable Tip', 'Second Actionable Tip', 'Third Actionable Tip', 'Relevant Hashtag 1', 'Relevant Hashtag 2', 'Relevant Hashtag 3', 'Desired Tone']
),
(
  'SEO Blog Post Outline',
  'Create a comprehensive blog post outline that ranks well in search engines',
  'Copywriting',
  ARRAY['blog', 'seo', 'content'],
  'Create a comprehensive blog post outline about [Topic] targeting [Target Audience].

SEO RESEARCH:
Primary keyword: [Primary Keyword]
Secondary keywords: [Secondary Keywords]
Search intent: [Search Intent]
Competitor analysis: [Competitor Insights]

BLOG POST OUTLINE:

1. COMPELLING TITLE (H1)
   - Include primary keyword naturally
   - Use numbers, questions, or emotional triggers
   - Keep under 60 characters
   - Options: [Title Options]

2. INTRODUCTION (150-200 words)
   - Hook with surprising statistic or relatable problem
   - State the main pain point [Pain Point]
   - Promise a solution/value proposition
   - Include primary keyword in first paragraph

3. MAIN CONTENT (3-5 sections)
   Section 1: [Section 1 Title]
   - Key points: [Section 1 Points]
   - Include secondary keyword: [Secondary Keyword 1]
   
   Section 2: [Section 2 Title]
   - Key points: [Section 2 Points]
   - Include secondary keyword: [Secondary Keyword 2]
   
   Section 3: [Section 3 Title]
   - Key points: [Section 3 Points]
   - Include secondary keyword: [Secondary Keyword 3]

4. PRACTICAL EXAMPLES
   - Case study: [Case Study Example]
   - Step-by-step process: [Process Example]
   - Real-world application: [Application Example]

5. CONCLUSION (100-150 words)
   - Summarize key takeaways
   - Reinforce main value proposition
   - Include call-to-action: [CTA]
   - End with question to encourage engagement

6. SEO ELEMENTS
   - Meta description: [Meta Description]
   - Featured image alt text: [Image Alt Text]
   - Internal linking opportunities: [Internal Links]
   - External authority links: [External Links]

Word count target: [Word Count]
Tone: [Content Tone]
Publishing date: [Publish Date]',
  ARRAY['Topic', 'Target Audience', 'Primary Keyword', 'Secondary Keywords', 'Search Intent', 'Competitor Insights', 'Title Options', 'Pain Point', 'Section 1 Title', 'Section 1 Points', 'Secondary Keyword 1', 'Section 2 Title', 'Section 2 Points', 'Secondary Keyword 2', 'Section 3 Title', 'Section 3 Points', 'Secondary Keyword 3', 'Case Study Example', 'Process Example', 'Application Example', 'CTA', 'Meta Description', 'Image Alt Text', 'Internal Links', 'External Links', 'Word Count', 'Content Tone', 'Publish Date']
);

-- Create Row Level Security (RLS) policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to prompts
CREATE POLICY "Public prompts are viewable by everyone" ON prompts
  FOR SELECT USING (true);

-- Allow public submissions (for the submission form)
CREATE POLICY "Enable insert for submissions" ON submissions
  FOR INSERT WITH CHECK (true);

-- Allow admin to manage all data
CREATE POLICY "Admins can manage all data" ON prompts
  FOR ALL USING (true);
  
CREATE POLICY "Admins can manage all submissions" ON submissions
  FOR ALL USING (true);

-- Create function to check if user is admin (for future use)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- For now, return true (adjust based on your auth system)
  RETURN true;
END;
$$;
