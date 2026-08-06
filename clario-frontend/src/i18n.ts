import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      nav: {
        home: "Home",
        about: "About",
        dashboard: "Dashboard",
        journal: "Journal",
        settings: "Settings",
        signin: "Sign In",
        signout: "Sign Out",
      },
      index: {
        badge: "Voice-First AI Journal",
        hero_h1_1: "Clarity through",
        hero_h1_2: "reflection",
        hero_desc:
          "Clario is a no-contact AI journaling app. Speak your thoughts freely — Clario listens, understands, and reveals the patterns beneath, helping you build emotional awareness one day at a time.",
        cta: "Start Your Daily Reflection",
        how_badge: "How it works",
        how_title_1: "A gentler way to",
        how_title_2: "know yourself",
        voices_badge: "Voices",
        voices_title_1: "What people are",
        voices_title_2: "feeling",
        features: {
          voice: {
            title: "10–15 Min Voice Journaling",
            desc: "Speak freely. Clario listens, transcribes, and gently guides your reflection.",
          },
          insights: {
            title: "Daily Insights",
            desc: "Receive personalized observations about your patterns, growth, and emotional themes.",
          },
          streak: {
            title: "Streak Tracking",
            desc: "Build consistency with gentle nudges and milestone celebrations.",
          },
          mood: {
            title: "Mood & Emotion Trends",
            desc: "Visualize your emotional landscape over days, weeks, and months.",
          },
        },
        testimonials: {
          sarah: {
            quote:
              "Clario helped me notice patterns I'd been blind to for years. It's like having a wise friend who just listens.",
            role: "Therapist",
          },
          david: {
            quote:
              "The voice-first approach removes all friction. I journal every morning now — 47 day streak and counting.",
            role: "Software Engineer",
          },
          elena: {
            quote:
              "I finally understand my moods. The insights are thoughtful, never generic. This is what AI should be.",
            role: "Graduate Student",
          },
        },
      },
      about: {
        badge: "Our Mission",
        title_1: "Improving mental clarity through",
        title_2: "AI-guided reflection",
        desc:
          "We believe self-understanding shouldn't require a therapist's schedule or a writer's discipline. Clario meets you where you are — your voice, your pace, your truth.",
        team_title_1: "The people behind",
        team_title_2: "Clario",
        approach_badge: "Our Approach",
        approach_title_1: "Built with",
        approach_title_2: "care",
        tech: {
          voice: {
            label: "Voice AI",
            desc: "On-device speech processing with cloud-based NLP for nuanced emotional analysis.",
          },
          privacy: {
            label: "Privacy First",
            desc: "End-to-end encryption. Your reflections are processed but never stored in readable form.",
          },
          adaptive: {
            label: "Adaptive Learning",
            desc: "Clario's insights evolve with you, recognizing recurring themes and growth over time.",
          },
        },
      },
      login: {
        signin_subtitle: "Sign in to your account",
        signup_subtitle: "Create a new account",
        email: "Email",
        password: "Password",
        wait: "Please wait...",
        signin: "Sign in",
        signup: "Sign up",
        no_account: "Don't have an account?",
        have_account: "Already have an account?",
        check_email_title: "Check your email",
        check_email_desc: "We sent you a confirmation link.",
        error_title: "Error",
      },
      settings: {
        account: "Account",
        title_1: "Your",
        title_2: "settings",
        profile: "Profile",
        name: "Name",
        email: "Email",
        appearance: "Appearance",
        light: "Light",
        dark: "Dark",
        notifications: "Notifications",
        daily_reminder: "Daily reminder",
        daily_reminder_desc: "Gentle nudge to journal each day",
        streak_notifs: "Streak notifications",
        streak_notifs_desc: "Celebrate milestones and streaks",
        weekly_digest: "Weekly digest",
        weekly_digest_desc: "Summary of your week's reflections",
        reminder_time: "Reminder Time",
        privacy: "Privacy",
        privacy_desc:
          "Your voice recordings are processed on-device and never stored in readable form. Only anonymized mood data is used to generate insights. You can request full data deletion at any time.",
        save_changes: "Save changes",
        saved: "Settings saved",
        language: "Language",
        language_desc: "Choose your preferred language",
      },
      dashboard: {
        greeting: "Good morning",
        title_1: "Your",
        title_2: "dashboard",
      },
    },
  },
  ne: {
    translation: {
      nav: {
        home: "गृहपृष्ठ",
        about: "बारेमा",
        dashboard: "ड्यासबोर्ड",
        journal: "जर्नल",
        settings: "सेटिङ",
        signin: "साइन इन",
        signout: "साइन आउट",
      },
      index: {
        badge: "भ्वाइस-फर्स्ट AI जर्नल",
        hero_h1_1: "प्रतिबिम्बद्वारा",
        hero_h1_2: "स्पष्टता",
        hero_desc:
          "Clario नो-कन्ट्याक्ट AI जर्नलिङ एप हो। आफ्ना विचारहरू स्वतन्त्र रूपमा बोल्नुस् — Clario सुन्छ, बुझ्छ, र ढाँचाहरू प्रकट गर्छ, जसले तपाईंलाई भावनात्मक जागरूकता बनाउन मद्दत गर्छ।",
        cta: "आफ्नो दैनिक प्रतिबिम्ब सुरु गर्नुस्",
        how_badge: "कसरी काम गर्छ",
        how_title_1: "आफूलाई",
        how_title_2: "चिन्ने सौम्य तरिका",
        voices_badge: "आवाजहरू",
        voices_title_1: "मानिसहरू के",
        voices_title_2: "महसुस गर्दैछन्",
        features: {
          voice: {
            title: "१०–१५ मिनेट भ्वाइस जर्नलिङ",
            desc: "स्वतन्त्र रूपमा बोल्नुस्। Clario सुन्छ र सौम्य रूपमा मार्गदर्शन गर्छ।",
          },
          insights: {
            title: "दैनिक अन्तर्दृष्टि",
            desc: "तपाईंका ढाँचा, वृद्धि र भावनात्मक विषयहरूमा व्यक्तिगत अवलोकन पाउनुस्।",
          },
          streak: {
            title: "स्ट्रिक ट्र्याकिङ",
            desc: "निरन्तरता निर्माण गर्न सौम्य सम्झाइ र उपलब्धि उत्सव पाउनुस्।",
          },
          mood: {
            title: "मूड र भावना प्रवृत्ति",
            desc: "दिन, हप्ता र महिनामा भावनात्मक प्रवृत्ति दृश्य रूपमा हेर्नुस्।",
          },
        },
        testimonials: {
          sarah: {
            quote: "Clario ले मलाई वर्षौंदेखि छुटेका ढाँचाहरू देख्न मद्दत गर्यो।",
            role: "थेरापिस्ट",
          },
          david: {
            quote: "भ्वाइस-फर्स्टले सबै घर्षण हटाइदियो। म अब हरेक बिहान जर्नल गर्छु।",
            role: "सफ्टवेयर इन्जिनियर",
          },
          elena: {
            quote: "म अन्ततः आफ्नो मूड बुझ्न थालेँ।",
            role: "स्नातक विद्यार्थी",
          },
        },
      },
      about: {
        badge: "हाम्रो मिशन",
        title_1: "मानसिक स्पष्टता सुधार गर्दै",
        title_2: "AI-निर्देशित प्रतिबिम्बद्वारा",
        desc:
          "हामी विश्वास गर्छौं कि आत्म-बोधका लागि थेरापिस्टको तालिका वा लेखन अनुशासन अनिवार्य छैन। Clario तपाईंको आवाज र गतिमा साथ दिन्छ।",
        team_title_1: "Clario पछाडिका",
        team_title_2: "मानिसहरू",
        approach_badge: "हाम्रो दृष्टिकोण",
        approach_title_1: "ध्यानका साथ",
        approach_title_2: "बनाइएको",
        tech: {
          voice: {
            label: "भ्वाइस AI",
            desc: "अन-डिभाइस स्पिच प्रोसेसिङ र क्लाउड NLP को संयोजन।",
          },
          privacy: {
            label: "गोपनीयता पहिले",
            desc: "एन्ड-टु-एन्ड सुरक्षा। तपाईंका प्रतिबिम्बहरू पठनयोग्य रूपमा भण्डारण हुँदैनन्।",
          },
          adaptive: {
            label: "अनुकूली सिकाइ",
            desc: "Clario का अन्तर्दृष्टिहरू तपाईंको यात्रासँगै विकसित हुन्छन्।",
          },
        },
      },
      login: {
        signin_subtitle: "आफ्नो खातामा साइन इन गर्नुस्",
        signup_subtitle: "नयाँ खाता बनाउनुस्",
        email: "इमेल",
        password: "पासवर्ड",
        wait: "कृपया पर्खनुस्...",
        signin: "साइन इन",
        signup: "साइन अप",
        no_account: "खाता छैन?",
        have_account: "पहिले नै खाता छ?",
        check_email_title: "इमेल जाँच गर्नुस्",
        check_email_desc: "हामीले तपाईंलाई पुष्टि लिंक पठाएका छौं।",
        error_title: "त्रुटि",
      },
      settings: {
        account: "खाता",
        title_1: "तपाईंको",
        title_2: "सेटिङ",
        profile: "प्रोफाइल",
        name: "नाम",
        email: "इमेल",
        appearance: "देखावट",
        light: "लाइट",
        dark: "डार्क",
        notifications: "सूचनाहरू",
        daily_reminder: "दैनिक अनुस्मारक",
        daily_reminder_desc: "हरेक दिन जर्नल गर्न सम्झाइ",
        streak_notifs: "स्ट्रिक सूचनाहरू",
        streak_notifs_desc: "माइलस्टोन र स्ट्रिकहरू उत्सव",
        weekly_digest: "साप्ताहिक सारांश",
        weekly_digest_desc: "हप्ताको प्रतिबिम्बको सारांश",
        reminder_time: "अनुस्मारक समय",
        privacy: "गोपनीयता",
        privacy_desc:
          "तपाईंका रेकर्डिङहरू अन-डिभाइस प्रशोधन हुन्छन् र पठनयोग्य रूपमा भण्डारण हुँदैनन्।",
        save_changes: "परिवर्तन बचत गर्नुस्",
        saved: "सेटिङ बचत भयो",
        language: "भाषा",
        language_desc: "आफ्नो मनपर्ने भाषा छान्नुस्",
      },
      dashboard: {
        greeting: "शुभ प्रभात",
        title_1: "तपाईंको",
        title_2: "जर्नल",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("clario-lang") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
