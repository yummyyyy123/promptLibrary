# 📊 **How to Check Your Supabase Database**

## 🗄️ **Method 1: Supabase Dashboard (Recommended)**

### Step-by-Step:

1. **Open Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Login to your account
   - Click on your project: `urqzfyvbkmibwhjlpyyo`

2. **Navigate to Tables**
   - In left sidebar, click **"Table Editor"** (grid icon)
   - You should see: `prompts` and `submissions` tables

3. **View Your Data**
   - Click on **`prompts`** table to see all approved prompts
   - Click on **`submissions`** table to see user submissions
   - You can sort, filter, and edit data here

4. **Check Table Structure**
   - Click **"..."** next to table name → **"Edit table"**
   - Verify columns match your schema

## 📋 **Method 2: SQL Editor**

1. **Go to SQL Editor**
   - Click **"SQL Editor"** (table icon) in left sidebar
   - Click **"New query"**

2. **Run These Queries:**

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Count prompts
SELECT COUNT(*) as total_prompts FROM prompts;

-- Count submissions
SELECT COUNT(*) as total_submissions FROM submissions;

-- See recent prompts
SELECT title, category, created_at FROM prompts 
ORDER BY created_at DESC LIMIT 5;

-- See pending submissions
SELECT title, submitted_by, submitted_at FROM submissions 
WHERE status = 'pending' 
ORDER BY submitted_at DESC;
```

## 🖥️ **Method 3: Test via Your App**

1. **Submit a Test Prompt**
   - Go to `http://localhost:3000`
   - Click **"Submit Prompt"**
   - Fill out form and submit

2. **Check Admin Panel**
   - Go to `http://localhost:3000/admin`
   - Login with `root`/`root`
   - Your submission should appear under **"Pending"**

3. **Approve the Submission**
   - Click the **checkmark** ✅ to approve
   - Check if it appears in main prompts table

## 🔍 **What to Look For:**

### ✅ **Success Indicators:**
- Tables appear in Supabase dashboard
- Data shows up correctly
- No error messages
- Your app submissions appear in admin panel

### ⚠️ **Common Issues:**
- **Empty tables**: SQL schema didn't run
- **Permission errors**: RLS policies missing
- **Connection errors**: Wrong URL or service key

## 🛠️ **Quick Test Script**

Create a test file `test-db.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://urqzfyvbkmibwhjlpyyo.supabase.co',
  'your-service-key-here'
)

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('count')
      .single()
    
    if (error) {
      console.error('Database error:', error)
    } else {
      console.log('Connected! Total prompts:', data)
    }
  } catch (err) {
    console.error('Connection failed:', err)
  }
}

testConnection()
```

Run with: `node test-db.js`

## 🎯 **Expected Results:**

1. **Tables Created**: `prompts` and `submissions`
2. **Data Flow**: App → Supabase → Admin Panel
3. **Real-time Updates**: Changes appear instantly
4. **Secure Access**: Only admin can approve/reject

## 📱 **Mobile Check:**

Supabase dashboard works on mobile too:
- Open supabase.com on your phone
- Navigate to your project
- Check tables and data

**Your database is ready! The easiest way is to use the Supabase dashboard to see your data.**
