/**
 * EmailBase — composant de base partagé par les templates InkFlow (react-email + Resend).
 * DA alignée sur `emails/supabase-auth-confirm-signup.html` et `supabase/functions/_shared/emailLayout.ts`.
 */

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Button,
  Hr,
  Section,
  Row,
  Column,
  Link,
  Img,
} from '@react-email/components';

const DEFAULT_APP_URL = 'https://app.ink-flow.me';
const DEFAULT_SITE_URL = 'https://ink-flow.me';

const FONT_EMAIL =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const DEFAULT_HERO =
  'https://images.unsplash.com/photo-1552627019-947c3789ffb5?ixlib=rb-4.1.0&auto=format&fit=crop&crop=entropy&w=1600&h=640&q=88';

export const colors = {
  page: '#f6f6f6',
  card: '#ffffff',
  wordmark: '#000000',
  title: '#333333',
  body: '#363c3b',
  muted: '#666666',
  recap: '#f6f6f6',
  ctaBg: '#0b5394',
  ctaText: '#ffffff',
  link: '#0b5394',
  divider: '#e5e5e5',
} as const;

export const styles = {
  body: {
    backgroundColor: colors.page,
    margin: 0,
    padding: '32px 16px',
    fontFamily: FONT_EMAIL,
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: colors.card,
  },
  wordmarkWrap: {
    padding: '40px 40px 8px',
    textAlign: 'center' as const,
  },
  wordmarkLink: {
    textDecoration: 'none',
    color: colors.wordmark,
  },
  wordmark: {
    fontSize: '36px',
    fontWeight: 900,
    color: colors.wordmark,
    letterSpacing: '-0.03em',
    lineHeight: '1.15',
    margin: '0',
    padding: 0,
    fontFamily: FONT_EMAIL,
  },
  tagline: {
    fontSize: '11px',
    color: colors.muted,
    lineHeight: '16px',
    marginTop: '8px',
    marginBottom: '0',
    fontFamily: FONT_EMAIL,
  },
  heroSection: {
    padding: 0,
    lineHeight: 0,
    fontSize: 0,
  },
  content: {
    padding: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 400,
    color: colors.title,
    lineHeight: '1.2',
    marginTop: '0',
    marginBottom: '0',
    fontFamily: FONT_EMAIL,
  },
  bodyText: {
    fontSize: '20px',
    color: colors.body,
    lineHeight: '30px',
    marginTop: '16px',
    marginBottom: '0',
    whiteSpace: 'pre-line' as const,
    fontFamily: FONT_EMAIL,
  },
  bulletText: {
    fontSize: '18px',
    color: colors.body,
    lineHeight: '28px',
    marginTop: '8px',
    marginBottom: '0',
    fontFamily: FONT_EMAIL,
  },
  recapRow: {
    backgroundColor: colors.recap,
    borderRadius: '8px',
    padding: '10px 12px',
    marginBottom: '6px',
    border: `1px solid ${colors.divider}`,
  },
  recapLabel: {
    fontSize: '12px',
    color: colors.muted,
    margin: 0,
    fontFamily: FONT_EMAIL,
  },
  recapValue: {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.title,
    textAlign: 'right' as const,
    margin: 0,
    fontFamily: FONT_EMAIL,
  },
  cta: {
    backgroundColor: colors.ctaBg,
    borderRadius: '30px',
    color: colors.ctaText,
    fontSize: '18px',
    fontWeight: 600,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
    lineHeight: '24px',
    marginTop: '24px',
    fontFamily: FONT_EMAIL,
  },
  ctaSecondary: {
    backgroundColor: colors.card,
    borderRadius: '30px',
    color: colors.ctaBg,
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '10px 22px',
    lineHeight: '22px',
    marginTop: '12px',
    border: `2px solid ${colors.ctaBg}`,
    fontFamily: FONT_EMAIL,
  },
  divider: {
    borderColor: colors.divider,
    borderTopWidth: '1px',
    marginTop: '36px',
    marginBottom: '0',
  },
  footerNote: {
    fontSize: '14px',
    color: colors.muted,
    lineHeight: '22px',
    marginTop: '20px',
    marginBottom: '0',
    whiteSpace: 'pre-line' as const,
    fontFamily: FONT_EMAIL,
  },
  copyright: {
    fontSize: '13px',
    color: colors.muted,
    lineHeight: '18px',
    marginTop: '14px',
    marginBottom: '0',
    fontFamily: FONT_EMAIL,
  },
  unsub: {
    fontSize: '12px',
    color: colors.muted,
    lineHeight: '18px',
    marginTop: '8px',
    marginBottom: '0',
    fontFamily: FONT_EMAIL,
  },
  footerLinks: {
    fontSize: '13px',
    color: colors.muted,
    textAlign: 'center' as const,
    marginTop: '24px',
    marginBottom: '0',
    lineHeight: '22px',
    fontFamily: FONT_EMAIL,
  },
  footerLink: {
    color: colors.link,
    fontWeight: 600,
    textDecoration: 'none',
    fontFamily: FONT_EMAIL,
  },
  footerMutedLink: {
    color: colors.muted,
    textDecoration: 'none',
    fontFamily: FONT_EMAIL,
  },
};

export interface RecapRow {
  label: string;
  value: string;
}

export interface EmailBaseProps {
  preview: string;
  title: string;
  bodyText: string;
  recap?: RecapRow[];
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  bullets?: string[];
  footerNote?: string;
  /** Lien du wordmark (défaut app InkFlow) */
  appUrl?: string;
  /** Image hero sous le wordmark (largeur 600) */
  heroImageUrl?: string;
  /** URL du lien sur l’image hero (ex. même URL que le CTA) */
  heroHref?: string;
}

export function EmailBase({
  preview,
  title,
  bodyText,
  recap,
  ctaLabel,
  ctaHref = '#',
  secondaryCtaLabel,
  secondaryCtaHref = '#',
  bullets,
  footerNote,
  appUrl = DEFAULT_APP_URL,
  heroImageUrl,
  heroHref,
}: EmailBaseProps) {
  const year = new Date().getFullYear();
  const heroTarget = heroHref ?? ctaHref;

  return (
    <Html lang="fr">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.card}>
          <Section style={styles.wordmarkWrap}>
            <Link href={appUrl} style={styles.wordmarkLink}>
              <Text style={styles.wordmark}>INKFLOW</Text>
            </Link>
            <Text style={styles.tagline}>Le studio dans ta poche.</Text>
          </Section>

          {heroImageUrl ? (
            <Section style={styles.heroSection}>
              <Link href={heroTarget}>
                <Img src={heroImageUrl} width={600} alt="" style={{ display: 'block', width: '100%', maxWidth: '600px', height: 'auto' }} />
              </Link>
            </Section>
          ) : null}

          <Section style={styles.content}>
            <Text style={styles.title}>{title}</Text>

            <Text style={styles.bodyText}>{bodyText}</Text>

            {bullets?.map((b, i) => (
              <Text key={i} style={styles.bulletText}>
                · {b}
              </Text>
            ))}

            {recap && (
              <Section style={{ marginTop: '20px' }}>
                {recap.map((row, i) => (
                  <Row key={i} style={styles.recapRow}>
                    <Column>
                      <Text style={styles.recapLabel}>{row.label}</Text>
                    </Column>
                    <Column style={{ textAlign: 'right' }}>
                      <Text style={styles.recapValue}>{row.value}</Text>
                    </Column>
                  </Row>
                ))}
              </Section>
            )}

            {ctaLabel && (
              <Button href={ctaHref} style={styles.cta}>
                {ctaLabel}
              </Button>
            )}

            {secondaryCtaLabel && (
              <Button href={secondaryCtaHref} style={styles.ctaSecondary}>
                {secondaryCtaLabel}
              </Button>
            )}

            <Hr style={styles.divider} />

            {footerNote && <Text style={styles.footerNote}>{footerNote}</Text>}

            <Text style={styles.copyright}>© {year} InkFlow. Tous droits réservés.</Text>
            <Text style={styles.unsub}>Gérer mes préférences · Se désabonner</Text>

            <Text style={styles.footerLinks}>
              <Link href="https://www.instagram.com/inkflowme" style={styles.footerLink}>
                Instagram
              </Link>
              {' · '}
              <Link href={DEFAULT_SITE_URL} style={styles.footerMutedLink}>
                Site web
              </Link>
              {' · '}
              <Link href="mailto:contact@ink-flow.me" style={styles.footerMutedLink}>
                Support
              </Link>
            </Text>
            <Text style={{ ...styles.footerNote, marginTop: '12px', textAlign: 'center', fontSize: '11px' }}>Paris, France</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export { DEFAULT_HERO };
