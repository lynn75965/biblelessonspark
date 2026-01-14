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
      "settings": "Configuración",
      "logout": "Cerrar Sesión",
      "login": "Iniciar Sesión",
      "signUp": "Registrarse",
      
      // Lesson Generation
      "generateLesson": "Generar Lección",
      "teacherTranscript": "Transcripción del Maestro",
      "studentHandout": "Material del Estudiante",
      "lessonPlan": "Plan de Lección",
      "createNewLesson": "Crear Nueva Lección",
      
      // Form Labels
      "topic": "Tema",
      "passage": "Pasaje Bíblico",
      "gradeLevel": "Nivel de Grado",
      "duration": "Duración de la Lección",
      "lessonType": "Tipo de Lección",
      "additionalNotes": "Notas Adicionales",
      
      // Actions
      "generate": "Generar",
      "download": "Descargar",
      "downloadPDF": "Descargar PDF",
      "downloadDOCX": "Descargar DOCX",
      "emailLesson": "Enviar Lección por Email",
      "print": "Imprimir",
      "share": "Compartir",
      "save": "Guardar",
      "cancel": "Cancelar",
      "edit": "Editar",
      "delete": "Eliminar",
      
      // Status Messages
      "generating": "Generando lección...",
      "success": "¡Éxito!",
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
      "accountSettings": "Configuración de Cuenta",
      "profile": "Perfil",
      
      // Descriptions
      "lessonDescription": "Crea lecciones de Escuela Dominical atractivas y bíblicamente sólidas",
      "selectLanguage": "Elige el idioma para el contenido de tu lección",
    }
  },
  fr: {
    translation: {
      // Navigation & General
      "home": "Accueil",
      "dashboard": "Tableau de Bord",
      "settings": "Paramètres",
      "logout": "Déconnexion",
      "login": "Connexion",
      "signUp": "S'inscrire",
      
      // Lesson Generation
      "generateLesson": "Générer la Leçon",
      "teacherTranscript": "Transcription de l'Enseignant",
      "studentHandout": "Document pour l'Élève",
      "lessonPlan": "Plan de Leçon",
      "createNewLesson": "Créer une Nouvelle Leçon",
      
      // Form Labels
      "topic": "Sujet",
      "passage": "Passage Biblique",
      "gradeLevel": "Niveau Scolaire",
      "duration": "Durée de la Leçon",
      "lessonType": "Type de Leçon",
      "additionalNotes": "Notes Supplémentaires",
      
      // Actions
      "generate": "Générer",
      "download": "Télécharger",
      "downloadPDF": "Télécharger le PDF",
      "downloadDOCX": "Télécharger le DOCX",
      "emailLesson": "Envoyer la Leçon par Email",
      "print": "Imprimer",
      "share": "Partager",
      "save": "Enregistrer",
      "cancel": "Annuler",
      "edit": "Modifier",
      "delete": "Supprimer",
      
      // Status Messages
      "generating": "Génération de la leçon...",
      "success": "Succès !",
      "error": "Erreur",
      "loading": "Chargement...",
      "saved": "Enregistré avec succès",
      
      // Grade Levels
      "preschool": "Préscolaire",
      "elementary": "Élémentaire",
      "middleSchool": "Collège",
      "highSchool": "Lycée",
      "adult": "Adultes",
      
      // Time Durations
      "minutes": "minutes",
      "30min": "30 minutes",
      "45min": "45 minutes",
      "60min": "60 minutes",
      
      // Settings
      "languagePreference": "Langue du Contenu",
      "accountSettings": "Paramètres du Compte",
      "profile": "Profil",
      
      // Descriptions
      "lessonDescription": "Créez des leçons d'école du dimanche engageantes et bibliquement solides",
      "selectLanguage": "Choisissez la langue pour le contenu de votre leçon",
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
