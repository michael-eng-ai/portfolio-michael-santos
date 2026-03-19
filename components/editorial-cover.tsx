import Image from "next/image";
import { BriefcaseBusiness, Newspaper, Sparkles } from "lucide-react";

type EditorialCoverProps = {
  variant: "insight" | "news" | "case";
  eyebrow: string;
  title: string;
  supportingText: string;
  meta?: string;
  imageUrl?: string;
};

const variantConfig = {
  insight: {
    icon: Sparkles,
    className: "editorial-cover-insight",
  },
  news: {
    icon: Newspaper,
    className: "editorial-cover-news",
  },
  case: {
    icon: BriefcaseBusiness,
    className: "editorial-cover-case",
  },
} as const;

export function EditorialCover({
  variant,
  eyebrow,
  title,
  supportingText,
  meta,
  imageUrl,
}: EditorialCoverProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={`editorial-cover ${config.className}`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="editorial-cover__image"
        />
      ) : (
        <div className="editorial-cover__grid" />
      )}
      <div className="editorial-cover__content">
        <div className="flex items-center justify-between gap-4">
          <span className="editorial-cover__eyebrow">{eyebrow}</span>
          <span className="editorial-cover__icon">
            <Icon size={18} />
          </span>
        </div>
        <div className="space-y-3">
          <h3 className="editorial-cover__title">{title}</h3>
          <p className="editorial-cover__supporting">{supportingText}</p>
        </div>
        {meta ? <p className="editorial-cover__meta">{meta}</p> : null}
      </div>
    </div>
  );
}
