/**
 * Une seule page = tous les modèles react-email empilés (aperçu type planche Figma).
 * `npm run email:dev` → choisir ce fichier dans la liste.
 */
import { Body, Head, Html, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

import { colors, EmailBaseFrame, styles } from './EmailBase';

const catalogBand = {
  maxWidth: '600px' as const,
  margin: '0 auto' as const,
  backgroundColor: '#e8e8e8',
  padding: '12px 20px',
  borderLeft: '4px solid #0b5394',
};

const bandTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  margin: 0,
  color: colors.title,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
};

const bandMeta: React.CSSProperties = {
  fontSize: 12,
  color: colors.muted,
  margin: '6px 0 0',
  lineHeight: 1.4,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
};

const gap: React.CSSProperties = {
  height: 32,
  backgroundColor: colors.page,
  lineHeight: 0,
  fontSize: 0,
};

function Band({ id, name, subject }: { id: string; name: string; subject: string }) {
  return (
    <Section style={catalogBand}>
      <Text style={bandTitle}>
        {id} — {name}
      </Text>
      <Text style={bandMeta}>Objet : {subject}</Text>
    </Section>
  );
}

const inviteDemo = {
  siteUrl: 'https://ink-flow.me',
  confirmationUrl: 'https://app.ink-flow.me/invite#démo',
  token: '629184',
};

export default function InkflowCatalogAllTemplates() {
  const codeLine = `Tu peux aussi utiliser le code à usage unique : ${inviteDemo.token}`;

  return (
    <Html lang="fr">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>InkFlow — aperçu de tous les modèles (développement)</Preview>
      <Body style={styles.body}>
        <Section style={{ maxWidth: 600, margin: '0 auto 24px', padding: 16 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: 800,
              margin: 0,
              color: colors.title,
              fontFamily: 'Inter, Helvetica, Arial, sans-serif',
            }}
          >
            INKFLOW — catalogue e-mails
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              margin: '8px 0 0',
              lineHeight: 1.5,
              fontFamily: 'Inter, Helvetica, Arial, sans-serif',
            }}
          >
            Tous les templates partagent la base (wordmark, couleurs, CTA, pied). L’invitation
            n’inclut pas d’image (fiabilité clients mail).
          </Text>
        </Section>

        <Band
          id="1"
          name="Bienvenue — confirmer le compte"
          subject="Bienvenue sur InkFlow — confirme ton adresse email"
        />
        <EmailBaseFrame
          title="Bienvenue sur InkFlow."
          bodyText="Ton compte est créé — ton studio est prêt à être configuré. Confirme ton adresse email pour activer l'accès à ton dashboard."
          recap={[
            { label: 'Studio', value: 'Studio Lune' },
            { label: 'Plan', value: 'Pro' },
            { label: 'Vitrine', value: 'ink-flow.me/studio-lune' },
          ]}
          ctaLabel="Confirmer mon email"
          ctaHref="https://app.ink-flow.me/confirm-demo"
          footerNote="Si tu n'es pas à l'origine de cette inscription, tu peux ignorer cet email."
        />
        <Section style={gap} />

        <Band id="2" name="Invitation équipe" subject="Invitation InkFlow" />
        <EmailBaseFrame
          figmaInviteLayout
          title="Tu es invité sur InkFlow"
          bodyContent={
            <>
              <Text style={styles.bodyTextInvite}>
                Tu as été invité à créer ton compte sur InkFlow (lié à {inviteDemo.siteUrl}).
              </Text>
              <Text style={styles.bodyTextInvite}>
                Clique sur le bouton pour accepter l’invitation et définir ton accès.
              </Text>
              <Text style={{ ...styles.bodyTextInvite, fontWeight: 700 }}>{codeLine}</Text>
              <Text style={styles.bodyTextInvite}>
                Important : si tu n’attendais pas cette invitation, ignore ce message.
              </Text>
            </>
          }
          showTagline={false}
          ctaLabel="Accepter l'invitation"
          ctaHref={inviteDemo.confirmationUrl}
          ctaStyle="invitation"
          customFooter={
            <>
              <Text style={styles.footerNoteInvite}>
                Si le bouton ne s’affiche pas, copie-colle ce lien dans ton navigateur :
                <br />
                {inviteDemo.confirmationUrl}
              </Text>
              <Text style={styles.signoffInvite}>
                À très vite,
                <br />
                L’équipe InkFlow
              </Text>
              <Text style={styles.helpLineInvite}>Des questions ? Visite ink-flow.me</Text>
            </>
          }
        />
        <Section style={gap} />

        <Band id="3" name="Espace client — lien magique" subject="Ton espace client — My InkFlow" />
        <EmailBaseFrame
          title="Ton espace client — My InkFlow."
          bodyText="Clique sur le bouton ci-dessous pour accéder à ton espace et consulter tes réservations. Ce lien est valable 15 minutes."
          ctaLabel="Accéder à mon espace"
          ctaHref="https://app.ink-flow.me/magic-demo"
          footerNote="Si tu n'as pas demandé ce lien, ignore cet email. Il expirera automatiquement."
        />
        <Section style={gap} />

        <Band
          id="4"
          name="Finaliser la réservation (acompte)"
          subject="Action requise : finalisez votre réservation"
        />
        <EmailBaseFrame
          title="Action requise — finalisez votre réservation."
          bodyText="Votre créneau est réservé mais votre acompte n'a pas encore été réglé. Vous avez 12 heures pour confirmer avant annulation automatique."
          recap={[
            { label: 'Flash', value: 'Mandala — Série hiver' },
            { label: 'Date', value: 'Samedi 3 mai, 14h' },
            { label: 'Acompte dû', value: '50 €' },
          ]}
          ctaLabel="Payer l'acompte — 50 €"
          ctaHref="https://app.ink-flow.me/pay-demo"
          footerNote="Passé ce délai, le créneau sera libéré automatiquement."
        />
        <Section style={gap} />

        <Band
          id="5"
          name="Rendez-vous confirmé (client)"
          subject="Votre rendez-vous chez Studio Lune est confirmé"
        />
        <EmailBaseFrame
          title="Votre rendez-vous est confirmé."
          bodyText="Votre réservation est enregistrée. Vous recevrez un rappel 48h avant votre séance."
          recap={[
            { label: 'Studio', value: 'Studio Lune' },
            { label: 'Flash', value: 'Mandala — Série hiver' },
            { label: 'Date', value: 'Samedi 3 mai, 14h' },
            { label: 'Acompte', value: '50 €' },
          ]}
          ctaLabel="Voir mon rendez-vous"
          ctaHref="https://app.ink-flow.me/rdv-demo"
          footerNote="En cas d'empêchement, contactez le studio 48h à l'avance."
        />
        <Section style={gap} />

        <Band id="6" name="Demande non retenue" subject="Votre demande n'a pas été retenue" />
        <EmailBaseFrame
          title="Votre demande n'a pas été retenue."
          bodyText="Le tatoueur n'est pas en mesure de donner suite à votre demande pour le moment. Vous pouvez soumettre une nouvelle demande ou choisir un autre créneau depuis la vitrine."
          ctaLabel="Retourner à la vitrine"
          ctaHref="https://ink-flow.me/studio-lune"
          footerNote="Aucun paiement n'a été prélevé."
        />
        <Section style={gap} />

        <Band
          id="7"
          name="Projet custom accepté"
          subject="Bonne nouvelle — votre projet a été accepté"
        />
        <EmailBaseFrame
          title="Bonne nouvelle — votre projet a été accepté."
          bodyText="Studio Lune a accepté votre demande de projet custom. Échangez directement avec le tatoueur pour affiner les détails avant de fixer une date et valider l'acompte."
          ctaLabel="Accéder à la messagerie"
          ctaHref="https://app.ink-flow.me/messages-demo"
        />
        <Section style={gap} />

        <Band id="8" name="Acompte reçu" subject="Acompte reçu — 50 €" />
        <EmailBaseFrame
          title="Acompte reçu — merci."
          bodyText="Votre paiement a bien été reçu. Votre rendez-vous est maintenant confirmé. Vous recevrez un rappel 48h avant votre séance."
          recap={[
            { label: 'Montant', value: '50 €' },
            { label: 'Studio', value: 'Studio Lune' },
            { label: 'Date', value: 'Samedi 3 mai, 14h' },
          ]}
          ctaLabel="Voir mon rendez-vous"
          ctaHref="https://app.ink-flow.me/rdv-demo"
        />
        <Section style={gap} />

        <Band id="9" name="Rappel de séance (ex. J-1)" subject="Rappel RDV demain — Studio Lune" />
        <EmailBaseFrame
          title="Rappel — votre séance est demain."
          bodyText="Un rappel avant votre rendez-vous chez Studio Lune. Pensez à hydrater la zone la veille et à éviter l'alcool 24h avant."
          recap={[
            { label: 'Date', value: 'Samedi 3 mai, 14h' },
            { label: 'Adresse', value: '10 rue de la Fontaine, Paris' },
          ]}
          ctaLabel="Voir mon rendez-vous"
          ctaHref="https://app.ink-flow.me/rdv-demo"
        />
        <Section style={gap} />

        <Band id="10" name="J+1 soins" subject="Prends soin de ton tatouage — Studio Lune" />
        <EmailBaseFrame
          title="Prends soin de ton tatouage."
          bodyText="Merci pour ta confiance (Studio Lune). Voici quelques conseils pour les premiers jours :"
          bullets={[
            "Nettoyage doux matin et soir à l'eau tiède",
            'Crème cicatrisante fine, sans excès',
            'Évite le soleil direct et la piscine 3 semaines',
            'Ne pas gratter les croûtes',
          ]}
          footerNote="Des questions ? Réponds directement à cet email."
        />
        <Section style={gap} />

        <Band id="11" name="J+30 rappel vitrine" subject="Ton tattoo a 1 mois — Studio Lune" />
        <EmailBaseFrame
          title="Ton tattoo a 1 mois."
          bodyText="Le temps passe vite — si tu envisages une retouche ou un nouveau flash, Studio Lune est là. Découvre les derniers flashs disponibles depuis ta vitrine."
          ctaLabel="Voir les flashs disponibles"
          ctaHref="https://ink-flow.me/studio-lune"
        />
        <Section style={gap} />

        <Band
          id="12"
          name="Nouvelle demande (studio)"
          subject="Nouvelle demande de RDV — Alex Martin"
        />
        <EmailBaseFrame
          title="Nouvelle demande de RDV."
          bodyText="Une nouvelle demande de réservation vient d'arriver depuis votre vitrine InkFlow. Connectez-vous à votre dashboard pour valider ou refuser."
          recap={[
            { label: 'Client', value: 'Alex Martin' },
            { label: 'Flash', value: 'Rose — 120 €' },
            { label: 'Créneau', value: 'Mardi 6 mai, 10h' },
          ]}
          ctaLabel="Gérer la demande"
          ctaHref="https://app.ink-flow.me/dashboard-demo"
        />
        <Section style={gap} />

        <Band id="13" name="Reçu / facture" subject="Reçu 50 € — Studio Lune" />
        <EmailBaseFrame
          title="Ton paiement a bien été enregistré."
          bodyText="Acompte enregistré sur ta réservation du 3 mai. Conserve ce message pour ton suivi."
          recap={[
            { label: 'Studio', value: 'Studio Lune' },
            { label: 'Montant', value: '50 €' },
          ]}
          ctaLabel="Voir le détail / le reçu"
          ctaHref="https://app.ink-flow.me/receipt-demo"
          footerNote="Conserve cet email pour ta comptabilité. Aucun paiement n’est dû de plus."
        />
        <Section style={gap} />

        <Band id="14" name="Parrainage" subject="1 mois offert — merci pour le parrainage" />
        <EmailBaseFrame
          title="1 mois offert — merci."
          bodyText="Le studio Atelier Nord vient de rejoindre InkFlow grâce à ton lien de parrainage. En remerciement, 1 mois d'abonnement est automatiquement crédité sur ton compte. Chaque studio parrainé = 1 mois offert, sans limite."
          ctaLabel="Voir mon tableau de bord"
          ctaHref="https://app.ink-flow.me/dashboard-demo"
        />
        <Section style={gap} />

        <Band
          id="15"
          name="RDV confirmé (variante RdvConfirmeEmail)"
          subject="Votre rendez-vous est confirmé !"
        />
        <EmailBaseFrame
          title="Votre rendez-vous est confirmé."
          bodyText={`Bonjour Camille,

Nous sommes impatients de vous voir chez Studio Lune.`}
          recap={[{ label: 'Date', value: 'Lundi 4 mai 2026' }]}
          ctaLabel="Ouvrir mon espace client"
          ctaHref="https://app.ink-flow.me/client/rdv"
          secondaryCtaLabel="Site ink-flow.me"
          secondaryCtaHref="https://ink-flow.me"
          footerNote={[
            `Besoin d'aide ? Appelez-nous au 06 33 43 89 26, démarrez un chat dans l'application, ou consultez le centre d'assistance.`,
            `Préférences e-mail : https://ink-flow.me/parametres`,
            'Paris, France',
          ].join('\n\n')}
        />
        <Section style={{ ...gap, height: 48 }} />
      </Body>
    </Html>
  );
}
