import { useEffect } from "react";

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

export function useAnalytics() {
  // Track page view on component mount
  useEffect(() => {
    trackEvent("page_view", {
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const trackEvent = (name: string, properties?: Record<string, string | number | boolean>) => {
    // Send to Umami Analytics (already configured in index.html)
    if (window.umami) {
      window.umami.track(name, properties);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics]", name, properties);
    }
  };

  const trackArticleClick = (articleId: string, articleTitle: string) => {
    trackEvent("article_click", {
      article_id: articleId,
      article_title: articleTitle,
    });
  };

  const trackProjectClick = (projectId: string, projectTitle: string) => {
    trackEvent("project_click", {
      project_id: projectId,
      project_title: projectTitle,
    });
  };

  const trackServiceClick = (serviceId: string, serviceName: string) => {
    trackEvent("service_click", {
      service_id: serviceId,
      service_name: serviceName,
    });
  };

  const trackNewsletterSignup = (email: string) => {
    trackEvent("newsletter_signup", {
      email_domain: email.split("@")[1],
    });
  };

  const trackContactFormSubmit = (company: string) => {
    trackEvent("contact_form_submit", {
      company: company || "not_provided",
    });
  };

  const trackCalendlyOpen = () => {
    trackEvent("calendly_open");
  };

  const trackFAQExpand = (questionId: number, category: string) => {
    trackEvent("faq_expand", {
      question_id: questionId,
      category: category,
    });
  };

  return {
    trackEvent,
    trackArticleClick,
    trackProjectClick,
    trackServiceClick,
    trackNewsletterSignup,
    trackContactFormSubmit,
    trackCalendlyOpen,
    trackFAQExpand,
  };
}

// Type augmentation for window.umami
declare global {
  interface Window {
    umami?: {
      track: (name: string, properties?: Record<string, any>) => void;
    };
  }
}
