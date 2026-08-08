/**
 * EmailBase — composant de base partagé par les templates InkFlow (react-email + Resend).
 * DA alignée sur `emails/supabase-auth-confirm-signup.html` : wordmark **Inter** 900, corps **Outfit** (Edge `emailLayout.ts`). Option `figmaInviteLayout` = invitation Figma (Inter partout, en-tête / héro / CTA 100px).
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
import type { ReactNode } from 'react';

const DEFAULT_APP_URL = 'https://app.ink-flow.me';
const DEFAULT_SITE_URL = 'https://ink-flow.me';

const FONT_WORDMARK = 'Inter, Helvetica, Arial, sans-serif';
/** Titre + corps — maquette e-mail invitation (Figma), tout en Inter */
const FONT_INTER = 'Inter, Helvetica, Arial, sans-serif';
const FONT_BODY =
  "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
/**
 * Bannière 600px — même fichier que `public/images/email-confirm-banner.jpg` (déployé en /images/…).
 * URL absolue domaine InkFlow : évite les blocages Unsplash / hotlink en preview & chez les clients mail.
 */
const DEFAULT_HERO = 'https://ink-flow.me/images/email-confirm-banner.jpg';

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
    fontFamily: FONT_BODY,
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
  /** Figma — bloc header INKFLOW : pl 221, pr 40, py 40, titre centré dans la colonne */
  wordmarkWrapInvite: {
    padding: '40px 40px 40px 221px',
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
    fontFamily: FONT_WORDMARK,
  },
  tagline: {
    fontSize: '11px',
    color: colors.muted,
    lineHeight: '16px',
    marginTop: '8px',
    marginBottom: '0',
    fontFamily: FONT_BODY,
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
    fontFamily: FONT_BODY,
  },
  /** Figma 253:222 — titre héros */
  titleInvite: {
    fontSize: '32px',
    fontWeight: 400,
    color: colors.title,
    lineHeight: '1.2',
    marginTop: '0',
    marginBottom: '0',
    fontFamily: FONT_INTER,
  },
  bodyText: {
    fontSize: '20px',
    color: colors.body,
    lineHeight: '30px',
    marginTop: '16px',
    marginBottom: '0',
    whiteSpace: 'pre-line' as const,
    fontFamily: FONT_BODY,
  },
  /** Figma — paragraphes 20px / gap 16 */
  bodyTextInvite: {
    fontSize: '20px',
    color: colors.body,
    lineHeight: '1.4',
    marginTop: '16px',
    marginBottom: '0',
    fontFamily: FONT_INTER,
  },
  bulletText: {
    fontSize: '18px',
    color: colors.body,
    lineHeight: '28px',
    marginTop: '8px',
    marginBottom: '0',
    fontFamily: FONT_BODY,
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
    fontFamily: FONT_BODY,
  },
  recapValue: {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.title,
    textAlign: 'right' as const,
    margin: 0,
    fontFamily: FONT_BODY,
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
    fontFamily: FONT_BODY,
  },
  /** Variante e-mail invitation — CTA 20px, Outfit (legacy) */
  ctaInvitation: {
    backgroundColor: colors.ctaBg,
    borderRadius: '30px',
    color: colors.ctaText,
    fontSize: '20px',
    fontWeight: 400,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
    lineHeight: '24px',
    marginTop: '24px',
    fontFamily: FONT_BODY,
  },
  /**
   * Figma — bouton 100px de haut, px 20, py 10, Inter 20 régulier, pilule 30px
   * (hauteur/centering = une ligne)
   */
  ctaInvitationFigma: {
    backgroundColor: colors.ctaBg,
    borderRadius: '30px',
    color: colors.ctaText,
    fontSize: '20px',
    fontWeight: 400,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '0 20px',
    lineHeight: '100px',
    height: '100px',
    marginTop: '16px',
    fontFamily: FONT_INTER,
    boxSizing: 'border-box' as const,
  },
  footerNoteInvite: {
    fontSize: '14px',
    color: colors.muted,
    lineHeight: '1.4',
    marginTop: '16px',
    marginBottom: '0',
    fontFamily: FONT_INTER,
  },
  signoffInvite: {
    fontSize: '20px',
    color: colors.body,
    lineHeight: '1.4',
    marginTop: '16px',
    marginBottom: '0',
    fontWeight: 700,
    fontFamily: FONT_INTER,
  },
  helpLineInvite: {
    fontSize: '20px',
    color: colors.body,
    lineHeight: '1.4',
    marginTop: '16px',
    marginBottom: '0',
    fontWeight: 400,
    fontFamily: FONT_INTER,
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
    fontFamily: FONT_BODY,
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
    fontFamily: FONT_BODY,
  },
  copyright: {
    fontSize: '13px',
    color: colors.muted,
    lineHeight: '18px',
    marginTop: '14px',
    marginBottom: '0',
    fontFamily: FONT_BODY,
  },
  unsub: {
    fontSize: '12px',
    color: colors.muted,
    lineHeight: '18px',
    marginTop: '8px',
    marginBottom: '0',
    fontFamily: FONT_BODY,
  },
  footerLinks: {
    fontSize: '13px',
    color: colors.muted,
    textAlign: 'center' as const,
    marginTop: '24px',
    marginBottom: '0',
    lineHeight: '22px',
    fontFamily: FONT_BODY,
  },
  footerLink: {
    color: colors.link,
    fontWeight: 600,
    textDecoration: 'none',
    fontFamily: FONT_BODY,
  },
  footerMutedLink: {
    color: colors.muted,
    textDecoration: 'none',
    fontFamily: FONT_BODY,
  },
};

export interface RecapRow {
  label: string;
  value: string;
}

export interface EmailBaseProps {
  preview: string;
  title: string;
  /**
   * Texte du corps (paragraphe unique). Sauté si `bodyContent` est fourni.
   */
  bodyText?: string;
  /**
   * Contenu du corps (plusieurs blocs, emphases). Si défini, remplace l’ancrage unique `bodyText`.
   */
  bodyContent?: ReactNode;
  recap?: RecapRow[];
  ctaLabel?: string;
  ctaHref?: string;
  /** CTA 20px, police corps — aligné Figma n°Invitation (253:222) */
  ctaStyle?: 'default' | 'invitation';
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  bullets?: string[];
  footerNote?: string;
  /**
   * Pied de page entièrement sur mesure (ex. invitation). Remplace le bloc par défaut
   * (note + copyright + liens) et supprime le trait horizontal au-dessus.
   */
  customFooter?: ReactNode;
  /** Affiche le baseline « Le studio dans ta poche. » sous INKFLOW (défaut : oui) */
  showTagline?: boolean;
  /** Lien du wordmark (défaut app InkFlow) */
  appUrl?: string;
  /** Image hero sous le wordmark (largeur 600) */
  heroImageUrl?: string;
  /** URL du lien sur l’image hero (ex. même URL que le CTA) */
  heroHref?: string;
  /**
   * Pixels Figma n°invitation (padding header 221/40, hero 240px, Inter partout, CTA 100px, gaps 16).
   */
  figmaInviteLayout?: boolean;
}

export type EmailBaseFrameProps = Omit<EmailBaseProps, 'preview'>;

/**
 * Carte e-mail (wordmark INKFLOW + contenu) sans enveloppe `<Html>`.
 * Sert à composer le fichier `inkflow-catalog-all-templates.tsx` (tous les modèles sur une page, style Figma).
 */
export function EmailBaseFrame({
  title,
  bodyText = '',
  bodyContent,
  recap,
  ctaLabel,
  ctaHref = '#',
  ctaStyle = 'default',
  secondaryCtaLabel,
  secondaryCtaHref = '#',
  bullets,
  footerNote,
  customFooter,
  showTagline = true,
  appUrl = DEFAULT_APP_URL,
  heroImageUrl,
  heroHref,
  figmaInviteLayout = false,
}: EmailBaseFrameProps) {
  const year = new Date().getFullYear();
  const heroTarget = heroHref ?? ctaHref;
  const ctaButtonStyle =
    ctaStyle === 'invitation' && figmaInviteLayout
      ? styles.ctaInvitationFigma
      : ctaStyle === 'invitation'
        ? styles.ctaInvitation
        : styles.cta;
  const titleStyle = figmaInviteLayout ? styles.titleInvite : styles.title;
  const wordmarkSectionStyle = figmaInviteLayout ? styles.wordmarkWrapInvite : styles.wordmarkWrap;
  const heroImgStyle = figmaInviteLayout
    ? {
        display: 'block' as const,
        width: '600px',
        maxWidth: '600px',
        height: '240px',
        objectFit: 'cover' as const,
      }
    : { display: 'block' as const, width: '100%', maxWidth: '600px', height: 'auto' };

  return (
    <Container style={styles.card}>
      <Section style={wordmarkSectionStyle}>
        <Link href={appUrl} style={styles.wordmarkLink}>
          <Text style={styles.wordmark}>INKFLOW</Text>
        </Link>
        {showTagline ? <Text style={styles.tagline}>Le studio dans ta poche.</Text> : null}
      </Section>

      {heroImageUrl ? (
        <Section style={styles.heroSection}>
          <Link href={heroTarget}>
            <Img
              src={heroImageUrl}
              width={600}
              height={figmaInviteLayout ? 240 : undefined}
              alt="Tatoueur au travail — InkFlow"
              style={heroImgStyle}
            />
          </Link>
        </Section>
      ) : null}

      <Section style={styles.content}>
        <Text style={titleStyle}>{title}</Text>

        {bodyContent != null ? (
          bodyContent
        ) : bodyText ? (
          <Text style={styles.bodyText}>{bodyText}</Text>
        ) : null}

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
          <Button href={ctaHref} style={ctaButtonStyle}>
            {ctaLabel}
          </Button>
        )}

        {secondaryCtaLabel && (
          <Button href={secondaryCtaHref} style={styles.ctaSecondary}>
            {secondaryCtaLabel}
          </Button>
        )}

        {customFooter != null ? (
          customFooter
        ) : (
          <>
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
            <Text
              style={{
                ...styles.footerNote,
                marginTop: '12px',
                textAlign: 'center',
                fontSize: '11px',
              }}
            >
              Paris, France
            </Text>
          </>
        )}
      </Section>
    </Container>
  );
}

export function EmailBase({
  preview,
  title,
  bodyText = '',
  bodyContent,
  recap,
  ctaLabel,
  ctaHref = '#',
  ctaStyle = 'default',
  secondaryCtaLabel,
  secondaryCtaHref = '#',
  bullets,
  footerNote,
  customFooter,
  showTagline = true,
  appUrl = DEFAULT_APP_URL,
  heroImageUrl,
  heroHref,
  figmaInviteLayout = false,
}: EmailBaseProps) {
  const bodyRootStyle = figmaInviteLayout
    ? { ...styles.body, fontFamily: FONT_INTER }
    : styles.body;

  return (
    <Html lang="fr">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyRootStyle}>
        <EmailBaseFrame
          title={title}
          bodyText={bodyText}
          bodyContent={bodyContent}
          recap={recap}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          ctaStyle={ctaStyle}
          secondaryCtaLabel={secondaryCtaLabel}
          secondaryCtaHref={secondaryCtaHref}
          bullets={bullets}
          footerNote={footerNote}
          customFooter={customFooter}
          showTagline={showTagline}
          appUrl={appUrl}
          heroImageUrl={heroImageUrl}
          heroHref={heroHref}
          figmaInviteLayout={figmaInviteLayout}
        />
      </Body>
    </Html>
  );
}

export { DEFAULT_HERO };
