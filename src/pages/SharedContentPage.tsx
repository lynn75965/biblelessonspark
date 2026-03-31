// src/pages/SharedContentPage.tsx
// Phase E: Public-facing shared content page
// No auth required. Rendered when a teacher shares a lesson, devotional, or series.
// SSOT: digitalWingConfig.ts for all UI strings and CTA
// Design: clean minimal page, BibleLessonSpark branding footer with soft CTA (Option B)

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { DIGITAL_WING_UI } from '@/constants/digitalWingConfig';

interface SharedLesson {
  id: string;
  title: string;
  original_text: string;
  filters: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface SharedDevotional {
  id: string;
  title: string | null;
  bible_passage: string;
  content: string | null;
  created_at: string;
}

interface SharedSeries {
  id: string;
  series_name: string;
  created_at: string;
  total_lessons: number;
  lessons: Array<{
    id: string;
    title: string | null;
    original_text: string | null;
    series_lesson_number: number | null;
  }>;
}

type SharedContent =
  | { type: 'lesson';     content: SharedLesson }
  | { type: 'devotional'; content: SharedDevotional }
  | { type: 'series';     content: SharedSeries }
  | null;

export default function SharedContentPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData]       = useState<SharedContent>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('invalid');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      // Try lesson first, then devotional, then series
      const types = ['lesson', 'devotional', 'series'] as const;

      for (const type of types) {
        // Use fetch directly since get-shared-content is a GET with query params
        const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-content?token=${encodeURIComponent(token)}&type=${type}`;
        const resp  = await fetch(fnUrl, {
          headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        });

        if (resp.ok) {
          const json = await resp.json();
          if (json && json.type && json.content) {
            setData(json as SharedContent);
            setLoading(false);
            return;
          }
        }
      }

      setError('not_found');
      setLoading(false);
    };

    load();
  }, [token]);

  const renderMarkdown = (raw: string): React.ReactNode[] => {
    const lines    = raw.split('\n');
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) {
        elements.push(<div key={'sp-' + i} style={{ height: '8px' }} />);
        continue;
      }
      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={'hr-' + i} style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />);
        continue;
      }
      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        const text = trimmed.replace(/^#{1,2}\s+/, '').replace(/\*\*/g, '');
        elements.push(
          <div key={'h-' + i} style={{ fontSize: '16px', fontWeight: 700, color: '#1e3a5f', margin: '20px 0 6px 0' }}>
            {text}
          </div>
        );
        continue;
      }
      const parts = trimmed.split(/\*\*(.*?)\*\*/g);
      elements.push(
        <div key={'p-' + i} style={{ marginBottom: '6px', lineHeight: '1.6', color: '#1a1a1a' }}>
          {parts.map((part, pi) =>
            pi % 2 === 1
              ? <strong key={pi}>{part}</strong>
              : <span key={pi}>{part}</span>
          )}
        </div>
      );
    }
    return elements;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#6b7280' }}>
          <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px' }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '24px' }}>
        <AlertCircle style={{ width: '48px', height: '48px', color: '#9ca3af', marginBottom: '16px' }} />
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px', textAlign: 'center' }}>
          {DIGITAL_WING_UI.publicPageNotFound}
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', maxWidth: '400px' }}>
          {DIGITAL_WING_UI.publicPageNotFoundSub}
        </p>
        <a href={DIGITAL_WING_UI.publicPageCtaUrl} style={{ marginTop: '24px', fontSize: '13px', color: '#1e3a5f', textDecoration: 'underline' }}>
          {DIGITAL_WING_UI.publicPageCta}
        </a>
      </div>
    );
  }

  const renderContent = () => {
    if (data.type === 'lesson') {
      const lesson  = data.content;
      const passage = (lesson.filters as Record<string, string> | null)?.bible_passage || '';
      return (
        <>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e3a5f', marginBottom: '6px', lineHeight: '1.3' }}>
            {lesson.title}
          </h1>
          {passage && (
            <p style={{ fontSize: '15px', fontStyle: 'italic', color: '#6b7280', marginBottom: '16px' }}>{passage}</p>
          )}
          <div style={{ height: '3px', background: '#c9a84c', borderRadius: '2px', marginBottom: '24px' }} />
          {renderMarkdown(lesson.original_text || '')}
        </>
      );
    }

    if (data.type === 'devotional') {
      const dev = data.content;
      return (
        <>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e3a5f', marginBottom: '6px', lineHeight: '1.3' }}>
            {dev.title || 'Devotional'}
          </h1>
          <p style={{ fontSize: '15px', fontStyle: 'italic', color: '#6b7280', marginBottom: '16px' }}>{dev.bible_passage}</p>
          <div style={{ height: '3px', background: '#c9a84c', borderRadius: '2px', marginBottom: '24px' }} />
          {renderMarkdown(dev.content || '')}
        </>
      );
    }

    if (data.type === 'series') {
      const series = data.content;
      return (
        <>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e3a5f', marginBottom: '6px', lineHeight: '1.3' }}>
            {series.series_name}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            {series.lessons.length} {series.lessons.length === 1 ? 'Lesson' : 'Lessons'}
          </p>
          <div style={{ height: '3px', background: '#c9a84c', borderRadius: '2px', marginBottom: '24px' }} />
          {series.lessons.map((lesson, idx) => (
            <div key={lesson.id} style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e3a5f', marginBottom: '12px' }}>
                {'Lesson ' + (lesson.series_lesson_number ?? idx + 1) + ' \u2014 ' + (lesson.title || 'Untitled Lesson')}
              </h2>
              {renderMarkdown(lesson.original_text || '')}
              {idx < series.lessons.length - 1 && (
                <div style={{ height: '2px', background: '#e5e7eb', margin: '24px 0' }} />
              )}
            </div>
          ))}
        </>
      );
    }

    return null;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#1e3a5f', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BookOpen style={{ width: '20px', height: '20px', color: '#c9a84c' }} />
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
          BibleLessonSpark
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: '720px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        {renderContent()}
      </div>

      {/* Footer CTA */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '20px 24px', textAlign: 'center', background: '#ffffff' }}>
        <a
          href={DIGITAL_WING_UI.publicPageCtaUrl}
          style={{ fontSize: '13px', color: '#1e3a5f', textDecoration: 'none', fontWeight: 500 }}
        >
          {DIGITAL_WING_UI.publicPageCta}
        </a>
      </div>
    </div>
  );
}
