// Formulaire de contact : rien n'est envoyé par le site. Au clic, le message est
// mis en forme et la messagerie du visiteur s'ouvre (lien mailto:).
const formulaire = document.querySelector(".formulaire");

if (formulaire) {
  const succes = document.querySelector(".formulaire__succes");
  const apercu = succes.querySelector(".formulaire__apercu");
  const copier = succes.querySelector(".formulaire__copier");
  const resume = formulaire.querySelector(".formulaire__erreurs");
  const { email, objet, erreurRequis, erreurEmail, copie } = formulaire.dataset;
  const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const libelle = (champ) =>
    formulaire.querySelector(`label[for="${champ.id}"]`).childNodes[0].textContent.trim();

  const signaler = (champ, message) => {
    const erreur = document.getElementById(`${champ.id}-erreur`);
    champ.setAttribute("aria-invalid", message ? "true" : "false");
    if (erreur) {
      erreur.textContent = message;
      erreur.hidden = !message;
    }
  };

  const verifier = (champ) => {
    const valeur = champ.value.trim();
    if (champ.required && !valeur) return signaler(champ, erreurRequis), false;
    if (champ.type === "email" && valeur && !EMAIL_VALIDE.test(valeur)) return signaler(champ, erreurEmail), false;
    signaler(champ, "");
    return true;
  };

  for (const champ of formulaire.querySelectorAll("[required]")) {
    champ.addEventListener("blur", () => { if (champ.getAttribute("aria-invalid") === "true" || champ.value) verifier(champ); });
    champ.addEventListener("input", () => { if (champ.getAttribute("aria-invalid") === "true") verifier(champ); });
  }

  formulaire.addEventListener("submit", (e) => {
    e.preventDefault();
    const requis = [...formulaire.querySelectorAll("[required]")];
    const invalides = requis.filter((champ) => !verifier(champ));
    resume.hidden = invalides.length === 0;
    if (invalides.length) {
      invalides[0].focus();
      return;
    }

    const donnees = new FormData(formulaire);
    const lignes = [];
    for (const champ of formulaire.querySelectorAll("input, select, textarea")) {
      const valeur = String(donnees.get(champ.name) || "").trim();
      if (!valeur || champ.name === "message") continue;
      lignes.push(`${libelle(champ)} : ${valeur}`);
    }
    const corps = `${lignes.join("\n")}\n\n${String(donnees.get("message")).trim()}\n`;
    const sujet = `${donnees.get("type") || objet} — ${String(donnees.get("nom")).trim()}`;

    apercu.textContent = `${sujet}\n\n${corps}`;
    succes.hidden = false;
    succes.focus();
    location.href = `mailto:${email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
  });

  copier.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(apercu.textContent);
    } catch {
      const selection = getSelection();
      const plage = document.createRange();
      plage.selectNodeContents(apercu);
      selection.removeAllRanges();
      selection.addRange(plage);
      document.execCommand("copy");
    }
    const initial = copier.textContent;
    copier.textContent = copie;
    setTimeout(() => { copier.textContent = initial; }, 2500);
  });
}
