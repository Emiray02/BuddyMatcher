type SocialLinksProps = {
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  className?: string;
};

function normalizeExternalUrl(raw?: string | null) {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="7" y="10" width="2.2" height="7" fill="currentColor" />
      <circle cx="8.1" cy="7.6" r="1.3" fill="currentColor" />
      <path d="M12 17V10h2.1v1.1c.7-.9 1.5-1.4 2.6-1.4 2 0 3.3 1.3 3.3 3.9V17h-2.2v-3.2c0-1.3-.5-2.1-1.6-2.1-1.1 0-1.9.8-1.9 2.1V17H12z" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 4h3.6l4 5.3L16.9 4H20l-6 6.9L20.5 20H17l-4.4-5.8L7.3 20H4.1l6.2-7.1L3.8 4H5z" fill="currentColor" />
    </svg>
  );
}

export function SocialLinks({ instagramUrl, linkedinUrl, xUrl, className }: SocialLinksProps) {
  const links = [
    {
      key: "instagram",
      label: "Instagram",
      url: normalizeExternalUrl(instagramUrl),
      icon: <InstagramIcon />,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      url: normalizeExternalUrl(linkedinUrl),
      icon: <LinkedInIcon />,
    },
    {
      key: "x",
      label: "X",
      url: normalizeExternalUrl(xUrl),
      icon: <XIcon />,
    },
  ].filter((item) => Boolean(item.url));

  if (links.length === 0) {
    return null;
  }

  return (
    <div className={`social-link-row ${className ?? ""}`.trim()}>
      {links.map((item) => (
        <a
          key={item.key}
          href={item.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="social-link-icon"
          aria-label={item.label}
          title={item.label}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
