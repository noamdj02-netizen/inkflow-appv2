/**
 * EmailBase — composant de base partagé par les templates InkFlow (react-email + Resend).
 * DA : INKFLOW Black — fond #eae7e2 / CTA #161616 / crème #e8e3dc
 *
 * Les e-mails envoyés par les Edge Functions utilisent le même rendu visuel via
 * `supabase/functions/_shared/emailLayout.ts` (HTML string).
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
} from '@react-email/components';

export const colors = {
  bg: '#eae7e2',
  black: '#161616',
  body: '#404040',
  muted: '#808080',
  amber: '#786b4d',
  recap: '#dbd9d4',
  cream: '#e8e3dc',
  divider: '#c8c5bf',
} as const;

export const styles = {
  body: {
    backgroundColor: colors.bg,
    margin: 0,
    padding: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    maxWidth: '680px',
    margin: '0 auto',
    backgroundColor: colors.bg,
    padding: '0 24px',
  },
  wordmark: {
    fontSize: '48px',
    fontWeight: 900,
    color: colors.black,
    letterSpacing: '-2px',
    lineHeight: '1',
    marginTop: '24px',
    marginBottom: '0',
    padding: 0,
  },
  tagline: {
    fontSize: '11px',
    color: colors.muted,
    lineHeight: '16px',
    marginTop: '8px',
    marginBottom: '0',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: colors.black,
    lineHeight: '1.25',
    marginTop: '28px',
    marginBottom: '0',
  },
  bodyText: {
    fontSize: '16px',
    color: colors.body,
    lineHeight: '26px',
    marginTop: '14px',
    marginBottom: '0',
  },
  bulletText: {
    fontSize: '15px',
    color: colors.body,
    lineHeight: '24px',
    marginTop: '8px',
    marginBottom: '0',
  },
  recapRow: {
    backgroundColor: colors.recap,
    borderRadius: '6px',
    padding: '10px 12px',
    marginBottom: '6px',
  },
  recapLabel: {
    fontSize: '12px',
    color: colors.muted,
    margin: 0,
  },
  recapValue: {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.black,
    textAlign: 'right' as const,
    margin: 0,
  },
  cta: {
    backgroundColor: colors.black,
    borderRadius: '8px',
    color: colors.cream,
    fontSize: '15px',
    fontWeight: 700,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '14px 32px',
    maxWidth: '320px',
    marginTop: '24px',
  },
  divider: {
    borderColor: colors.divider,
    borderTopWidth: '1px',
    marginTop: '40px',
    marginBottom: '0',
  },
  footerNote: {
    fontSize: '13px',
    color: colors.muted,
    lineHeight: '20px',
    marginTop: '28px',
    marginBottom: '0',
  },
  copyright: {
    fontSize: '13px',
    color: colors.muted,
    lineHeight: '18px',
    marginTop: '14px',
    marginBottom: '0',
  },
  unsub: {
    fontSize: '12px',
    color: colors.amber,
    lineHeight: '18px',
    marginTop: '6px',
    marginBottom: '28px',
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
  bullets?: string[];
  footerNote?: string;
}

export function EmailBase({
  preview,
  title,
  bodyText,
  recap,
  ctaLabel,
  ctaHref = '#',
  bullets,
  footerNote,
}: EmailBaseProps) {
  const year = new Date().getFullYear();

  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.wordmark}>INKFLOW</Text>
          <Text style={styles.tagline}>Le studio dans ta poche.</Text>

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

          <Hr style={styles.divider} />

          {footerNote && <Text style={styles.footerNote}>{footerNote}</Text>}

          <Text style={styles.copyright}>© {year} InkFlow. Tous droits réservés.</Text>
          <Text style={styles.unsub}>Gérer mes préférences · Se désabonner</Text>
        </Container>
      </Body>
    </Html>
  );
}
