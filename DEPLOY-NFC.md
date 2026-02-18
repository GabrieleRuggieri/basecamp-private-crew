# Deploy BASECAMP su Vercel

Guida passo-passo per pubblicare l'app su Vercel.

---

## 1. Prepara il repository Git

Se il progetto non è ancora su Git:

```bash
git init
git add .
git commit -m "Initial commit"
```

Poi crea un repo su GitHub (o GitLab/Bitbucket) e collega:

```bash
git remote add origin https://github.com/TUO-USERNAME/basecamp-private-crew.git
git branch -M main
git push -u origin main
```

---

## 2. Crea il progetto su Vercel

1. Vai su [vercel.com](https://vercel.com) e accedi (o crea account)
2. Clicca **Add New** → **Project**
3. Importa il repository (GitHub/GitLab/Bitbucket)
4. Seleziona il repo `basecamp-private-crew`
5. **Framework Preset**: Next.js (dovrebbe essere già rilevato)
6. **Root Directory**: lascia vuoto
7. **Build Command**: `npm run build` (default)
8. **Output Directory**: lascia default

---

## 3. Variabili d'ambiente

Prima di fare **Deploy**, clicca **Environment Variables** e aggiungi:

| Nome | Valore | Note |
|------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Da Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Da Supabase → Settings → API (service_role, **non** anon) |
| `BASECAMP_SESSION_SECRET` | stringa lunga random | Es: `openssl rand -base64 32` |

⚠️ **Importante**: `BASECAMP_SESSION_SECRET` deve essere una stringa lunga e casuale (min 32 caratteri). Generala con:

```bash
openssl rand -base64 32
```

---

## 4. Deploy

Clicca **Deploy**. Vercel compilerà il progetto e ti darà un URL tipo:

```
https://basecamp-private-crew-xxx.vercel.app
```

---

## 5. Configura i tag NFC

1. Vai su **Admin**: `https://TUO-DOMINIO.vercel.app/admin/[admin-token]`
   - L'admin token è in `admin_config` nel DB (o nel seed)
2. Copia il **nfc_token** di ogni membro
3. Programma ogni tag NFC con l’URL:
   ```
   https://TUO-DOMINIO.vercel.app/enter/[nfc_token]
   ```
4. Al tap sul tag, il telefono apre l’URL e fa il login automatico

---

## 6. Dominio personalizzato (opzionale)

1. In Vercel: Project → **Settings** → **Domains**
2. Aggiungi il tuo dominio (es. `basecamp.tuodominio.it`)
3. Segui le istruzioni per i record DNS

---

## 7. Supabase: CORS e URL consentiti

Se usi un dominio custom, in Supabase:

1. **Authentication** → **URL Configuration**
2. Aggiungi `https://tuo-dominio.vercel.app` (o il dominio custom) in **Site URL** e **Redirect URLs**

---

## Checklist pre-deploy

- [ ] Codice su Git e pushato
- [ ] `NEXT_PUBLIC_SUPABASE_URL` impostato
- [ ] `SUPABASE_SERVICE_ROLE_KEY` impostato (service_role, non anon)
- [ ] `BASECAMP_SESSION_SECRET` impostato (stringa random 32+ caratteri)
- [ ] Build locale OK: `npm run build`

---

## Ritestare in dev (senza tag fisico)

1. In `app/page.tsx`: decommentare `devToken` e il `Link` "Simula NFC"
2. In `lib/validate-token.ts`: decommentare il blocco `DEV_NFC_TOKEN`
3. In `.env`: `DEV_NFC_TOKEN` = token di un membro (da admin)
