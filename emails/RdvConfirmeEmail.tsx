import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface RdvConfirmeEmailProps {
  clientName?: string;
  studioName?: string;
  date?: string;
  baseUrl?: string;
  conversationLink?: string;
  supportPhone?: string;
  supportAddress?: string;
}

export const RdvConfirmeEmail = ({
  clientName = 'Client',
  studioName = 'Mon studio',
  date = 'lundi 4 février 2030',
  baseUrl = 'https://ink-flow.me',
  conversationLink,
  supportPhone = '06 33 43 89 26',
  supportAddress = 'Paris, France',
}: RdvConfirmeEmailProps) => {
  const ctaUrl = conversationLink || baseUrl;

  return (
    <Html>
      <Head />
      <Preview>Votre rendez-vous est confirmé !</Preview>
      <Body style={main}>
        <Container style={container}>

          {/* Header INKFLOW (Style Canva) */}
          <Section style={header}>
            <Row>
              <Column align="left" style={{ width: '50%' }}>
                <Text style={logoIf}>IF.</Text>
              </Column>
              <Column align="right" style={{ width: '50%' }}>
                <Text style={logoInkflow}>INKFLOW</Text>
              </Column>
            </Row>
          </Section>

          {/* Message principal */}
          <Section style={bodySection}>
            <Text style={welcomeText}>
              Bonjour {clientName},<br/><br/>
              Nous sommes impatients de vous voir chez {studioName}.
            </Text>

            <Hr style={separator} />

            {/* Date */}
            <Section style={dateBox}>
              <Text style={dateText}>
                <strong>Date :</strong> {date}
              </Text>
            </Section>

            {/* Bouton Se connecter (cyan) */}
            <Section style={ctaSection}>
              <Button href={ctaUrl} style={ctaButton}>Se connecter à InkFlow</Button>
            </Section>
          </Section>

          {/* Footer (fond sombre, design NovaBank) */}
          <Section style={footer}>
            <Text style={footerTitle}>Besoin d'aide ?</Text>
            <Text style={footerHelp}>
              Appelez-nous au <Link href={`tel:${supportPhone.replace(/\s/g, '')}`} style={footerLinkStyle}>{supportPhone}</Link>,<br />
              démarrez un <strong>chat en direct</strong> dans l'application,<br />
              ou consultez notre <strong>Centre d'assistance</strong> à tout moment.
            </Text>
            <Text style={footerUnsubscribe}>
              <Link href={`${baseUrl}/parametres`} style={footerUnsubscribeLink}>Vous ne souhaitez plus recevoir ces e-mails ? Désabonnez-vous.</Link>
            </Text>
            <Text style={footerAddress}>{supportAddress}</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default RdvConfirmeEmail;

// --- STYLES CSS ---

const main = {
  backgroundColor: '#f0f1f5',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden' as const,
};

const header = {
  backgroundColor: '#000000',
  padding: '20px 30px',
};

const logoIf = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  fontStyle: 'italic',
  margin: '0',
};

const logoInkflow = {
  color: '#ffffff',
  fontSize: '18px',
  letterSpacing: '2px',
  margin: '0',
};

const bodySection = {
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const welcomeText = {
  fontSize: '18px',
  color: '#111827',
  textAlign: 'center' as const,
  margin: '0 0 30px 0',
  lineHeight: 1.5,
};

const separator = {
  borderColor: '#e5e5e5',
  margin: '20px 0',
};

const dateBox = {
  backgroundColor: '#fafafa',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '0 auto 30px auto',
  border: '1px solid #e5e5e5',
  maxWidth: '400px',
};

const dateText = {
  color: '#171717',
  fontSize: '16px',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginBottom: '10px',
};

const ctaButton = {
  backgroundColor: '#00c4cc',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
};

const footer = {
  padding: '30px 40px',
  backgroundColor: '#070300',
  textAlign: 'left' as const,
};

const footerTitle = {
  margin: '0 0 16px',
  fontSize: '20px',
  color: '#f6f5f1',
  fontWeight: '700',
};

const footerHelp = {
  margin: '0 0 16px',
  fontSize: '15px',
  color: '#f6f5f1',
  lineHeight: 1.5,
};

const footerLinkStyle = {
  color: '#f6f5f1',
  fontWeight: '700',
  textDecoration: 'none',
};

const footerUnsubscribe = {
  margin: '24px 0 8px',
  fontSize: '12px',
  color: '#bfc3c8',
  lineHeight: 1.3,
};

const footerUnsubscribeLink = {
  color: '#bfc3c8',
  textDecoration: 'underline',
};

const footerAddress = {
  margin: '0',
  fontSize: '12px',
  color: '#bfc3c8',
};
