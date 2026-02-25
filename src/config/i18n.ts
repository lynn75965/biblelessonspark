import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation & General
      "home": "Home",
      "dashboard": "Dashboard",
      "settings": "Settings",
      "logout": "Logout",
      "login": "Login",
      "signUp": "Sign Up",
      
      // Lesson Generation
      "generateLesson": "Generate Lesson",
      "teacherTranscript": "Teacher Transcript",
      "studentHandout": "Student Handout",
      "lessonPlan": "Lesson Plan",
      "createNewLesson": "Create New Lesson",
      
      // Form Labels
      "topic": "Topic",
      "passage": "Scripture Passage",
      "gradeLevel": "Grade Level",
      "duration": "Lesson Duration",
      "lessonType": "Lesson Type",
      "additionalNotes": "Additional Notes",
      
      // Actions
      "generate": "Generate",
      "download": "Download",
      "downloadPDF": "Download PDF",
      "downloadDOCX": "Download DOCX",
      "emailLesson": "Email Lesson",
      "print": "Print",
      "share": "Share",
      "save": "Save",
      "cancel": "Cancel",
      "edit": "Edit",
      "delete": "Delete",
      
      // Status Messages
      "generating": "Generating lesson...",
      "success": "Success!",
      "error": "Error",
      "loading": "Loading...",
      "saved": "Saved successfully",
      
      // Grade Levels
      "preschool": "Preschool",
      "elementary": "Elementary",
      "middleSchool": "Middle School",
      "highSchool": "High School",
      "adult": "Adult",
      
      // Time Durations
      "minutes": "minutes",
      "30min": "30 minutes",
      "45min": "45 minutes",
      "60min": "60 minutes",
      
      // Settings
      "languagePreference": "Content Language",
      "accountSettings": "Account Settings",
      "profile": "Profile",
      
      // Descriptions
      "lessonDescription": "Create engaging, biblically sound Sunday School lessons",
      "selectLanguage": "Choose the language for your lesson content",
    }
  },
  es: {
    translation: {
      // Navigation & General
      "home": "Inicio",
      "dashboard": "Panel",
      "settings": "Configuraci\u00F3n",
      "logout": "Cerrar Sesi\u00F3n",
      "login": "Iniciar Sesi\u00F3n",
      "signUp": "Registrarse",
      
      // Lesson Generation
      "generateLesson": "Generar Lecci\u00F3n",
      "teacherTranscript": "Transcripci\u00F3n del Maestro",
      "studentHandout": "Material del Estudiante",
      "lessonPlan": "Plan de Lecci\u00F3n",
      "createNewLesson": "Crear Nueva Lecci\u00F3n",
      
      // Form Labels
      "topic": "Tema",
      "passage": "Pasaje B\u00EDblico",
      "gradeLevel": "Nivel de Grado",
      "duration": "Duraci\u00F3n de la Lecci\u00F3n",
      "lessonType": "Tipo de Lecci\u00F3n",
      "additionalNotes": "Notas Adicionales",
      
      // Actions
      "generate": "Generar",
      "download": "Descargar",
      "downloadPDF": "Descargar PDF",
      "downloadDOCX": "Descargar DOCX",
      "emailLesson": "Enviar Lecci\u00F3n por Email",
      "print": "Imprimir",
      "share": "Compartir",
      "save": "Guardar",
      "cancel": "Cancelar",
      "edit": "Editar",
      "delete": "Eliminar",
      
      // Status Messages
      "generating": "Generando lecci\u00F3n...",
      "success": "\u00A1\u00C9xito!",
      "error": "Error",
      "loading": "Cargando...",
      "saved": "Guardado exitosamente",
      
      // Grade Levels
      "preschool": "Preescolar",
      "elementary": "Primaria",
      "middleSchool": "Secundaria",
      "highSchool": "Preparatoria",
      "adult": "Adultos",
      
      // Time Durations
      "minutes": "minutos",
      "30min": "30 minutos",
      "45min": "45 minutos",
      "60min": "60 minutos",
      
      // Settings
      "languagePreference": "Idioma del Contenido",
      "accountSettings": "Configuraci\u00F3n de Cuenta",
      "profile": "Perfil",
      
      // Descriptions
      "lessonDescription": "Crea lecciones de Escuela Dominical atractivas y b\u00EDblicamente s\u00F3lidas",
      "selectLanguage": "Elige el idioma para el contenido de tu lecci\u00F3n",
    }
  },
  fr: {
    translation: {
      // Navigation & General
      "home": "Accueil",
      "dashboard": "Tableau de Bord",
      "settings": "Param\u00E8tres",
      "logout": "D\u00E9connexion",
      "login": "Connexion",
      "signUp": "S'inscrire",
      
      // Lesson Generation
      "generateLesson": "G\u00E9n\u00E9rer la Le\u00E7on",
      "teacherTranscript": "Transcription de l'Enseignant",
      "studentHandout": "Document pour l'\u00C9l\u00E8ve",
      "lessonPlan": "Plan de Le\u00E7on",
      "createNewLesson": "Cr\u00E9er une Nouvelle Le\u00E7on",
      
      // Form Labels
      "topic": "Sujet",
      "passage": "Passage Biblique",
      "gradeLevel": "Niveau Scolaire",
      "duration": "Dur\u00E9e de la Le\u00E7on",
      "lessonType": "Type de Le\u00E7on",
      "additionalNotes": "Notes Suppl\u00E9mentaires",
      
      // Actions
      "generate": "G\u00E9n\u00E9rer",
      "download": "T\u00E9l\u00E9charger",
      "downloadPDF": "T\u00E9l\u00E9charger le PDF",
      "downloadDOCX": "T\u00E9l\u00E9charger le DOCX",
      "emailLesson": "Envoyer la Le\u00E7on par Email",
      "print": "Imprimer",
      "share": "Partager",
      "save": "Enregistrer",
      "cancel": "Annuler",
      "edit": "Modifier",
      "delete": "Supprimer",
      
      // Status Messages
      "generating": "G\u00E9n\u00E9ration de la le\u00E7on...",
      "success": "Succ\u00E8s !",
      "error": "Erreur",
      "loading": "Chargement...",
      "saved": "Enregistr\u00E9 avec succ\u00E8s",
      
      // Grade Levels
      "preschool": "Pr\u00E9scolaire",
      "elementary": "\u00C9l\u00E9mentaire",
      "middleSchool": "Coll\u00E8ge",
      "highSchool": "Lyc\u00E9e",
      "adult": "Adultes",
      
      // Time Durations
      "minutes": "minutes",
      "30min": "30 minutes",
      "45min": "45 minutes",
      "60min": "60 minutes",
      
      // Settings
      "languagePreference": "Langue du Contenu",
      "accountSettings": "Param\u00E8tres du Compte",
      "profile": "Profil",
      
      // Descriptions
      "lessonDescription": "Cr\u00E9ez des le\u00E7ons d'\u00E9cole du dimanche engageantes et bibliquement solides",
      "selectLanguage": "Choisissez la langue pour le contenu de votre le\u00E7on",
    }
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // Default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
