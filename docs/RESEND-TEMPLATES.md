# Templates Resend pour InkFlow

Les emails peuvent être envoyés soit en **HTML généré** dans les Edge Functions (comportement actuel), soit via des **templates Resend** avec variables.

## Créer les templates (une fois)

À la racine du projet, avec ta clé API Resend :

```bash
RESEND_API_KEY=re_xxxxxxxxx node scripts/create-resend-templates.mjs
```

Cela crée et publie deux templates dans ton compte Resend :

| Template (name = id/alias)   | Variables |
|-----------------------------|-----------|
| `inkflow-rdv-confirmation`  | `CLIENT_NAME`, `STUDIO_NAME`, `DATE`, `TIME_LABEL`, `DESCRIPTION` |
| `inkflow-conversation-link` | `CLIENT_NAME`, `STUDIO_NAME`, `CONVERSATION_LINK` |

Les templates doivent être **publiés** pour être utilisables à l’envoi.

## Envoyer avec un template (Edge Functions)

Le helper partagé `_shared/resend.ts` expose `sendWithTemplate()` :

```ts
import { sendWithTemplate, RESEND_FROM } from "../_shared/resend.ts";

const result = await sendWithTemplate({
  to: [payload.clientEmail],
  subject: `RDV confirmé — ${payload.studioName}`,
  templateId: "inkflow-rdv-confirmation",
  variables: {
    CLIENT_NAME: payload.clientName,
    STUDIO_NAME: payload.studioName,
    DATE: dateStr,
    TIME_LABEL: timeStr,
    DESCRIPTION: payload.description?.slice(0, 200) ?? "",
  },
});
```

- **templateId** : le `name` du template (ex. `inkflow-rdv-confirmation`) ou l’id UUID retourné à la création.
- **variables** : toutes les variables utilisées dans le HTML du template (ex. `{{{CLIENT_NAME}}}`) doivent être fournies, sinon Resend renverra une erreur.

Si tu préfères garder le HTML généré par `emailLayout.ts`, continue d’utiliser `sendEmail()` avec le HTML construit en Edge Function ; les templates sont optionnels.

## Référence API Resend

- [Créer un template](https://resend.com/docs/api-reference/templates/create-template)
- [Publier un template](https://resend.com/docs/api-reference/templates/publish-template)
- [Envoyer un email avec template](https://resend.com/docs/api-reference/emails/send-email) (body `template: { id, variables }`)

Variables interdites par Resend : `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `UNSUBSCRIBE_URL`.
