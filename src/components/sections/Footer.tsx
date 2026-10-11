import { AuralisLogo } from "@/components/ui/AuralisLogo";
import { Container } from "@/components/ui/Container";
import { footer } from "@/content/finalCta";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-line py-12">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <a href="#top">
            <AuralisLogo />
          </a>
          <nav aria-label={site.navLabels.primary}>
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {footer.nav.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-small text-muted transition-colors duration-300 hover:text-text"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t border-line pt-8 text-small text-muted md:flex-row md:justify-between">
          <p>{footer.copyright}</p>
          <p>{footer.disclaimer}</p>
        </div>
      </Container>
    </footer>
  );
}
