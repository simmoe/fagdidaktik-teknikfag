# Fagdidaktik teknikfag

Enkel SvelteKit-side til at samle noter og designe en interaktion. Layout og CMS er taget fra `Informatik-C-2026` (Tiptap + Firestore, ejer kan redigere når han er logget ind).

Repo: https://github.com/simmoe/fagdidaktik-teknikfag

Live: https://fagdidaktik-teknikfag.web.app

## Sider

- `/noter` — CMS-side. Første note er [Mod en praksisfunderet didaktik for epx-uddannelsen](https://www.gymnasieforskning.dk/aktuelt/mod-en-praksisfunderet-didaktik-for-epx-uddannelsen) (Ane Qvortrup og Anke Piekut, Gymnasieforskning, 16. marts 2026). Fallback ligger i `src/lib/cms/noter.ts`.
- `/interaktion` — tom flade i `src/routes/interaktion/+page.svelte`. Interaktionen bygges her.
- `/` sender videre til `/noter`.

## Kom i gang

```bash
npm install
npm run dev
```

http://localhost:5177

```bash
npm run deploy
```

Deployer kun hosting til https://fagdidaktik-teknikfag.web.app. `firebase.json` har ingen `firestore.rules`, så et deploy herfra ikke kan overskrive de delte regler.

Log ind med `simmoe@gmail.com` for at redigere noter. Knappen «Redigér side» vises kun for ejeren.

## Firebase

Delt projekt `p5-firebase-eebc1`. Denne app bruger kun:

- Firestore-collection `fagdidaktik_teknikfag_pages`
- Storage-prefix `fagdidaktik_teknikfag_cms/`

Regler er ikke deployet. Læsning og skrivning fejler, indtil et fragment er flettet ind i de **live** regler. Indtil da vises fallback-teksten. Deploy aldrig `firestore.rules` herfra. Hent live rules, flet, vis diff, og deploy kun efter eksplicit OK. Et hosting-deploy er ikke et rules-deploy.

```
function isFagdidaktikTeknikfagOwner() {
  return signedIn()
    && request.auth.token.email_verified == true
    && request.auth.token.email == 'simmoe@gmail.com';
}

match /fagdidaktik_teknikfag_pages/{id} {
  allow read: if true;
  allow create, update: if isFagdidaktikTeknikfagOwner()
    && id.matches('^[A-Za-z0-9._:-]{1,120}$')
    && request.resource.data.keys().hasOnly(['content', 'updatedAt'])
    && request.resource.data.content is map
    && request.resource.data.content.version == 1
    && request.resource.data.content.kind == 'content'
    && request.resource.data.updatedAt == request.time;
  allow delete: if isFagdidaktikTeknikfagOwner();
}
```

`signedIn()` skal være den funktion, der allerede findes i live rules. Storage-regler for `fagdidaktik_teknikfag_cms/` skal med i samme fletning, ellers kan billeder ikke uploades.

## Næste agent

Åbn mappen `/Users/simo/Documents/github/fagdidaktik-teknikfag`. Noter samles på CMS-siden. Interaktionen kodes i `src/routes/interaktion/+page.svelte`. Rør ikke Informatik C-collections (`informatik_c_2026_*`).
