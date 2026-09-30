import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Courses", href: "/courses" },
    { label: "AI Finder", href: "/finder" },
    { label: "Become Instructor", href: "/register" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Company: [
    { label: "About", href: "/" },
    { label: "Contact", href: "/" },
  ],
  Legal: [
    { label: "Privacy", href: "/" },
    { label: "Terms", href: "/" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      {/* Main footer body */}
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <p
            className="font-black tracking-[-0.06em] text-2xl text-[var(--fg)]"
            style={{ fontFamily: "var(--font-geist-sans, system-ui)" }}
          >
            OBLIVION
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--fg-tertiary)] max-w-[180px]">
            LEARN.<br />
            BUILD.<br />
            BECOME.
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([group, links]) => (
          <div key={group}>
            <p className="label-overline mb-4">{group}</p>
            <ul className="space-y-2.5">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-[var(--fg-tertiary)] hover:text-[var(--fg)] transition-colors duration-150 inline-flex items-center gap-1 group"
                  >
                    {label}
                    <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[var(--fg-quaternary)]">
            © {new Date().getFullYear()} Oblivion. All rights reserved.
          </p>
          <p className="text-xs text-[var(--fg-quaternary)] tracking-widest uppercase">
            Learn without limits.
          </p>
        </div>
      </div>
    </footer>
  );
}
