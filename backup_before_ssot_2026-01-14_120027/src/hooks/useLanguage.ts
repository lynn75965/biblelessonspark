import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Language = 'en' | 'es' | 'fr';

interface UseLanguageReturn {
  language: Language;
  loading: boolean;
  setLanguage: (lang: Language) => void;
  saveLanguage: () => Promise<void>;
  languageName: string;
}

/**
 * Custom hook for managing user language preferences
 * Automatically syncs with Supabase and i18next
 */
export function useLanguage(): UseLanguageReturn {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const { toast } = useToast();
  
  const [language, setLanguageState] = useState<Language>('en');
  const [loading, setLoading] = useState(true);

  const languageNames = {
    en: 'English',
    es: 'Español',
    fr: 'Français'
  };

  // Load language preference from database on mount
  useEffect(() => {
    async function loadLanguage() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading language:', error);
        } else {
          const userLang = (data?.preferred_language as Language) || 'en';
          setLanguageState(userLang);
          i18n.changeLanguage(userLang);
        }
      } catch (error) {
        console.error('Unexpected error loading language:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLanguage();
  }, [user, i18n]);

  // Listen for language change events from LanguageSelector
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<{ language: Language }>) => {
      const newLang = event.detail.language;
      setLanguageState(newLang);
      i18n.changeLanguage(newLang);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [i18n]);

  // Function to update language (updates local state and i18n, but doesn't save to DB)
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
  };

  // Function to save language preference to database
  const saveLanguage = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save preferences.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_language: language })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Language preference saved.',
      });

      // Dispatch event for other components
      window.dispatchEvent(
        new CustomEvent('languageChanged', { 
          detail: { language } 
        })
      );
    } catch (error) {
      console.error('Error saving language:', error);
      toast({
        title: 'Error',
        description: 'Failed to save language preference.',
        variant: 'destructive'
      });
    }
  };

  return {
    language,
    loading,
    setLanguage,
    saveLanguage,
    languageName: languageNames[language]
  };
}

/**
 * Hook to get the current user's language without the full management features
 * Useful for components that just need to read the language
 */
export function useUserLanguage(): Language {
  const { language } = useLanguage();
  return language;
}
