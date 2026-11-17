# EPX-didaktik

Enkel SvelteKit-side til at samle noter og designe en interaktion. Layout og CMS er taget fra `Informatik-C-2026` (Tiptap + Firestore, ejer kan redigere når han er logget ind).

Der er ingen remote og intet hosting-site endnu.

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

Log ind med `simmoe@gmail.com` for at redigere noter. Knappen «Redigér side» vises kun for ejeren.

## Firebase

Delt projekt `p5-firebase-eebc1`. Denne app bruger kun:

- Firestore-collection `epx_didaktik_pages`
- Storage-prefix `epx_didaktik_cms/`

Regler er ikke deployet. Læsning og skrivning fejler, indtil et fragment er flettet ind i de **live** regler. Indtil da vises fallback-teksten. Deploy aldrig `firestore.rules` herfra. Hent live rules, flet, vis diff, og deploy kun efter eksplicit OK. Et hosting-deploy er ikke et rules-deploy.

```
function isEpxDidaktikOwner() {
  return signedIn()
    && request.auth.token.email_verified == true
    && request.auth.token.email == 'simmoe@gmail.com';
}

match /epx_didaktik_pages/{id} {
  allow read: if true;
  allow create, update: if isEpxDidaktikOwner()
    && id.matches('^[A-Za-z0-9._:-]{1,120}$')
    && request.resource.data.keys().hasOnly(['content', 'updatedAt'])
    && request.resource.data.content is map
    && request.resource.data.content.version == 1
    && request.resource.data.content.kind == 'content'
    && request.resource.data.updatedAt == request.time;
  allow delete: if isEpxDidaktikOwner();
}
```

`signedIn()` skal være den funktion, der allerede findes i live rules. Storage-regler for `epx_didaktik_cms/` skal med i samme fletning, ellers kan billeder ikke uploades.

## Næste agent

Åbn mappen `/Users/simo/Documents/github/epx-didaktik`. Noter samles på CMS-siden. Interaktionen kodes i `src/routes/interaktion/+page.svelte`. Rør ikke Informatik C-collections (`informatik_c_2026_*`).
