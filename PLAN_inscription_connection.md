│ Plan to implement                                                                                  │
│                                                                                                    │
│ Plan : Fusion Connexion/Inscription + Background couvertures animees                               │
│                                                                                                    │
│ Objectif                                                                                           │
│                                                                                                    │
│ Fusionner les pages Connexion et Inscription en une seule page avec toggle, et ajouter un fond     │
│ anime de couvertures d'oeuvres.                                                                    │
│                                                                                                    │
│ Fichiers concernes                                                                                 │
│ ┌───────────────────────────────────────┬────────────────────────────────────────────────────────┐ │
│ │                Fichier                │                         Action                         │ │
│ ├───────────────────────────────────────┼────────────────────────────────────────────────────────┤ │
│ │ src/app/components/CoverBackground.js │ CREER - composant fond anime                           │ │
│ ├───────────────────────────────────────┼────────────────────────────────────────────────────────┤ │
│ │ src/app/Connexion/page.js             │ RECRIRE - page unifiee login+signup                    │ │
│ ├───────────────────────────────────────┼────────────────────────────────────────────────────────┤ │
│ │ src/app/Inscription/page.js           │ RECRIRE - redirection vers /Connexion?mode=inscription │ │
│ ├───────────────────────────────────────┼────────────────────────────────────────────────────────┤ │
│ │ src/app/Connexion/layout.js           │ MODIFIER - metadata mise a jour                        │ │
│ ├───────────────────────────────────────┼────────────────────────────────────────────────────────┤ │
│ │ src/app/Inscription/layout.js         │ MODIFIER - metadata simplifiee                         │ │
│ └───────────────────────────────────────┴────────────────────────────────────────────────────────┘ │
│ Etape 1 : Creer src/app/components/CoverBackground.js                                              │
│                                                                                                    │
│ Composant client qui :                                                                             │
│ - Fetch ~30 oeuvres avec couverture via                                                            │
│ ${apiUrl}/api/oeuvres?populate=couverture&pagination[limit]=30                                     │
│ - Filtre celles qui ont couverture?.url                                                            │
│ - Duplique le tableau si besoin pour remplir ~50 cellules                                          │
│ - Affiche une grille CSS responsive (grid-cols-5 mobile -> grid-cols-10 desktop)                   │
│ - Chaque image apparait avec stagger framer-motion (opacity 0->1, scale 0.8->1, delay index *      │
│ 0.05s)                                                                                             │
│ - Overlay gradient sombre par-dessus (from-gray-900/70 via-gray-900/80 to-gray-900/95)             │
│ - Images en <img> avec loading="lazy", aspect-[2/3], object-cover                                  │
│                                                                                                    │
│ Etape 2 : Recrire src/app/Connexion/page.js                                                        │
│                                                                                                    │
│ Page unifiee avec :                                                                                │
│                                                                                                    │
│ Structure :                                                                                        │
│ <Suspense> (requis pour useSearchParams en Next.js 15)                                             │
│   <div> (relative, min-h-screen, overflow-hidden)                                                  │
│     <CoverBackground />           (absolute, z-0)                                                  │
│     <motion.div>                   (z-10, glassmorphism container)                                 │
│       <h2> Titre dynamique                                                                         │
│       <p> Sous-titre dynamique                                                                     │
│       <ToggleTabs />               (Connexion | Inscription)                                       │
│       <AnimatePresence mode="wait">                                                                │
│         <LoginForm /> ou <SignupForm />  (slide horizontal)                                        │
│       </AnimatePresence>                                                                           │
│     </motion.div>                                                                                  │
│   </div>                                                                                           │
│ </Suspense>                                                                                        │
│                                                                                                    │
│ State :                                                                                            │
│ - mode : "connexion" | "inscription" (init depuis searchParams.get("mode"))                        │
│ - States login : identifier, loginPassword, showLoginPassword, loginError, loginLoading            │
│ - States signup : username, email, signupPassword, confirmPassword, showSignupPassword,            │
│ showConfirmPassword, signupError, signupSuccess, signupLoading, passwordValidations                │
│                                                                                                    │
│ Toggle tabs :                                                                                      │
│ - 2 boutons dans un container bg-gray-700/50 rounded-lg p-1                                        │
│ - Tab active Connexion = bg-indigo-600, Inscription = bg-purple-600                                │
│ - Transition CSS transition-all duration-300                                                       │
│                                                                                                    │
│ Animation forms :                                                                                  │
│ - Login entre par la gauche (x: -20), sort par la droite (x: 20)                                   │
│ - Signup entre par la droite (x: 20), sort par la gauche (x: -20)                                  │
│ - AnimatePresence mode="wait", duration 0.3s                                                       │
│                                                                                                    │
│ Glassmorphism container :                                                                          │
│ - bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl                 │
│                                                                                                    │
│ Comportement inscription reussie :                                                                 │
│ - Affiche message succes 2s                                                                        │
│ - Auto-switch vers mode connexion                                                                  │
│ - Pre-remplit identifier avec l'email utilisee                                                     │
│                                                                                                    │
│ Login handler : identique a l'actuel (fetch auth/local, fetch users/me, login(), router.back())    │
│                                                                                                    │
│ Signup handler : identique a l'actuel sauf redirection remplacee par switch de mode                │
│                                                                                                    │
│ Etape 3 : Recrire src/app/Inscription/page.js                                                      │
│                                                                                                    │
│ Simple redirect :                                                                                  │
│ router.replace("/Connexion?mode=inscription");                                                     │
│ Avec router.replace (pas push) pour eviter boucle back-button.                                     │
│                                                                                                    │
│ Etape 4 : Mettre a jour les layouts                                                                │
│                                                                                                    │
│ Connexion/layout.js : titre = "Connexion & Inscription | Novel-Index"                              │
│ Inscription/layout.js : titre simplifie, pas de canonical                                          │
│                                                                                                    │
│ Comportement attendu                                                                               │
│ ┌─────────────────────────────┬──────────────────────────────────────────────────────────┐         │
│ │           Action            │                         Resultat                         │         │
│ ├─────────────────────────────┼──────────────────────────────────────────────────────────┤         │
│ │ /Connexion                  │ Affiche form login                                       │         │
│ ├─────────────────────────────┼──────────────────────────────────────────────────────────┤         │
│ │ /Connexion?mode=inscription │ Affiche form signup                                      │         │
│ ├─────────────────────────────┼──────────────────────────────────────────────────────────┤         │
│ │ /Inscription                │ Redirige vers /Connexion?mode=inscription                │         │
│ ├─────────────────────────────┼──────────────────────────────────────────────────────────┤         │
│ │ Clic tab toggle             │ Switch avec animation slide                              │         │
│ ├─────────────────────────────┼──────────────────────────────────────────────────────────┤         │
│ │ Inscription reussie         │ Message 2s puis switch auto vers login, email pre-rempli │         │
│ ├─────────────────────────────┼──────────────────────────────────────────────────────────┤         │
│ │ Login reussi                │ router.back()                                            │         │
│ └─────────────────────────────┴──────────────────────────────────────────────────────────┘         │
│ Verification                                                                                       │
│                                                                                                    │
│ 1. Aller sur /Connexion -> fond de couvertures s'affiche avec stagger                              │
│ 2. Toggle entre Connexion/Inscription -> animation fluide                                          │
│ 3. Aller sur /Inscription -> redirige vers /Connexion?mode=inscription                             │
│ 4. Creer un compte -> switch auto vers login avec email pre-rempli                                 │
│ 5. Se connecter -> navbar mise a jour immediatement, retour page precedente                        │
│ 6. Mobile : grille adaptee, formulaire lisible, backdrop-blur fonctionne                           │
│ 7. Build next build passe sans erreur       