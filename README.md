# Secret Match API

Aplikacija za Secret Match  z registracijo, admin vmesnikom in email obvestili.

## Namestitev

git clone https://github.com/MojcaMarin14/SECRET_MATCH_API.git
cd SECRET_MATCH_API/backend
npm install

## Konfiguracija

V mapi backend/ ustvari .env datoteko:

PORT=3000
MONGODB_URI=mongodb://localhost:27017/secret-match
JWT_SECRET=vas_skrivni_kljuc
EMAIL_USER=vas-email@gmail.com
EMAIL_PASSWORD=app-password

## Zagon

npm run dev

Odpri:
http://localhost:3000

## Funkcionalnosti

- Registracija in prijava (JWT)
- Naključno dodeljevanje parov
- Admin nadzor
- Email obvestila
- MongoDB baza

## Admin prijava

Email: admin@secretmatch.com
Geslo: admin123

## API Endpointi

Avtentikacija:
POST /users/register
POST /users/login

Dogodek:
POST /match/join
GET /match/view

Admin:
POST /match/assign
POST /match/reset
GET /match/stats
POST /match/notify

## KAKO DELUJE
Za udeležence:

Registriraj se z emailom in geslom
Pridruži se dogodku
Čakaj da admin dodeli pare
Ogledaj si svojega dodeljenega partnerja


Za administratorja:

Prijavi se z admin@secretmatch.com / admin123
Preglej statistiko - koliko je udeležencev
Dodeli pare - en klik za naključno razporeditev
Pošlji obvestila - email vsem udeležencem

## TEHNOLOGIJE
Backend: Node.js, Express.js, MongoDB
Avtentikacija: JWT, bcrypt
Email: Nodemailer, Gmail SMTP
Frontend: HTML5, CSS3, JavaScript
Baza: Mongoose ODM

## Odpravljanje težav
Emaili ne pridejo?
- Omogoči 2-step verification v Google
- Ustvari App Password (ne navadno geslo)
- Preveri .env nastavitve
  
Pari se ne dodelijo?

- Preveri da je vsaj 2 uporabnika pridruženih
- Preveri console za napake (F12 → Network)
- Preveri da si prijavljen kot admin
  
Avtor: Mojca Marin