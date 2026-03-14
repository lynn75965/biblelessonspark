const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://hphebzdftpjbiudpfcrs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwaGViemRmdHBqYml1ZHBmY3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDk0MjksImV4cCI6MjA3NjM4NTQyOX0.WSNtUrxihquk0ZV0tT7uaad8W3MNjIUwCD4hG0jr-eo'
);

async function main() {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, created_at, original_text, shaped_content')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Query error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error('No lessons found (RLS may be blocking unauthenticated reads)');
    process.exit(1);
  }

  const row = data[0];
  const content = row.shaped_content || row.original_text || '(no content)';
  const output = [
    'LESSON ID: ' + row.id,
    'TITLE: ' + row.title,
    'CREATED: ' + row.created_at,
    'FIELD: ' + (row.shaped_content ? 'shaped_content' : 'original_text'),
    '========== RAW CONTENT ==========',
    content,
  ].join('\n');

  fs.writeFileSync('lesson_raw.txt', output, 'utf8');
  console.log(output);
}

main();
