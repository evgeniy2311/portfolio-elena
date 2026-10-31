import { ContactLink } from "@/components/ui/contact-link";

/**
 * Липкая панель «2 кадра бесплатно» на экранах уже 1024 px. Когда её показывать, решает ScrollFx
 * (data-cta на <html>): на главной после блока услуг, на остальных страницах после первого экрана;
 * всегда скрыта, пока видны первый экран или контакты. Скрытая панель недоступна для Tab.
 */
export function MobileTrialBar() {
  return (
    <div className="mobile-cta" data-mobile-cta>
      <ContactLink intent="trial" className="button">
        2 кадра бесплатно
      </ContactLink>
    </div>
  );
}
