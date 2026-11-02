import type { ReactNode } from "react";
import { ArrowIcon } from "@/components/arrow-icon";
import { telegramHref, type ContactIntent } from "@/lib/site";

type Props = { intent: ContactIntent; className?: string; children: ReactNode; arrow?: boolean };

/**
 * Кнопка-обращение с поводом (intent). Когда Telegram подтверждён, открывает чат с готовым сообщением
 * в новой вкладке; пока адреса нет, ведёт к блоку контактов на этой же странице (он есть везде).
 */
export function ContactLink({ intent, className = "button", children, arrow = true }: Props) {
  const href = telegramHref(intent);
  const content = (
    <>
      {children}
      {arrow ? <ArrowIcon /> : null}
    </>
  );
  if (href) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return (
    <a className={className} href="#contact">
      {content}
    </a>
  );
}
