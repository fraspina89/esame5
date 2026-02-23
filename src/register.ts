// Interfaccia per l'indirizzo: tutte le proprietà sono opzionali
export interface IAddress {
  // via/strada
  street?: string;
  // città
  city?: string;
  // CAP
  zip?: string;
  // provincia (sigla o nome)
  province?: string;
}

// Interfaccia principale per i dati di registrazione
export interface IUserRegistration {
  firstName: string;           // nome (obbligatorio)
  lastName: string;            // cognome (obbligatorio)
  email: string;               // email (obbligatoria)
  phone?: string;              // telefono (opzionale)
  address?: IAddress;          // indirizzo (opzionale)
  password: string;            // password (obbligatoria)
  confirmPassword?: string;    // conferma password (opzionale nel payload)
  acceptTerms: boolean;        // consenso ai termini (obbligatorio)
}

/**
 * Recupera il valore testuale di un campo del form.
 * Ritorna stringa vuota se il campo non esiste.
 */
function getInputValue(form: HTMLFormElement, name: string) {
  const el = form.elements.namedItem(name) as HTMLInputElement | null;
  return el ? el.value.trim() : '';
}

/**
 * Marca un elemento come invalido e, se presente, popola il messaggio
 * di `.invalid-feedback` nel gruppo di controllo.
 * Supporta anche RadioNodeList (gruppi radio).
 */
function setInvalid(el: Element | RadioNodeList | null, message?: string) {
  if (!el) return;
  let inputEl: HTMLInputElement | null = null;
  if (el instanceof Element) {
    inputEl = el as HTMLInputElement;
  } else {
    // RadioNodeList 
    const r = el as RadioNodeList;
    inputEl = (r && r.length && typeof r.item === 'function') ? (r.item(0) as HTMLInputElement) : null;
  }
  if (!inputEl) return;

  // Aggiunge classe standard di bootstrap per il campo invalido
  inputEl.classList.add('is-invalid');

  // Prova a trovare un contenitore che contenga .invalid-feedback
  const group = inputEl.closest('.mb-2, .form-group, .field-with-star, .form-check, .form-floating') as HTMLElement | null;
  let fb: HTMLElement | null = null;
  if (group) fb = group.querySelector('.invalid-feedback');
  if (!fb) fb = inputEl.parentElement?.querySelector('.invalid-feedback') as HTMLElement | null;

  // Se troviamo il feedback e c'è un messaggio, lo mostriamo
  if (fb && message) {
    fb.textContent = message;
    fb.classList.add('d-block');
  }
}

/**
 * Rimuove tutte le evidenziazioni di errore nel form e nasconde
 * i messaggi di feedback precedenti.
 */
function clearInvalid(form: HTMLFormElement) {
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  // nascondi i messaggi di feedback precedenti
  form.querySelectorAll('.invalid-feedback').forEach(fb => fb.classList.remove('d-block'));
}

/**
 * Validatore minimale che lavora sul DOM del form.
 * Nota: non trasforma i dati, solo controlla la presenza e alcune regole basilari.
 */
export class FormValidator {
  form: HTMLFormElement;
  constructor(form: HTMLFormElement) { this.form = form; }

  /** Esegue la validazione e ritorna true se il form è valido */
  validate(): boolean {
    clearInvalid(this.form);
    let valid = true;

    // Campi obbligatori: elenco di nomi 
    const requiredNames = ['firstName','lastName','email','address.street','address.city','password','confirmPassword','acceptTerms'];
    requiredNames.forEach(name => {
      const value = getInputValue(this.form, name);
      if (name === 'acceptTerms') {
        // checkbox termini
        const cb = this.form.elements.namedItem(name) as HTMLInputElement | null;
        if (!cb || !cb.checked) { setInvalid(cb, 'Devi accettare i termini.'); valid = false; }
        return;
      }
      if (!value) {
        const el = this.form.elements.namedItem(name) as HTMLInputElement | null;
        setInvalid(el, 'Campo obbligatorio.');
        valid = false;
      }
    });

    // Controllo semplice sulla email
    const email = getInputValue(this.form, 'email');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInvalid(this.form.elements.namedItem('email'), 'Inserisci una email valida.');
      valid = false;
    }

    // Password: lunghezza minima e semplicità di complessità
    const pwd = getInputValue(this.form, 'password');
    if (pwd) {
      if (pwd.length < 8) {
        setInvalid(this.form.elements.namedItem('password'), 'La password deve avere almeno 8 caratteri.');
        valid = false;
      } else {
        const hasUpper = /[A-Z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        if (!hasUpper || !hasNumber) {
          setInvalid(this.form.elements.namedItem('password'), 'La password deve contenere almeno una lettera maiuscola e un numero.');
          valid = false;
        }
      }
    }

    // Conferma password
    const confirm = getInputValue(this.form, 'confirmPassword');
    if (pwd && confirm && pwd !== confirm) {
      setInvalid(this.form.elements.namedItem('confirmPassword'), 'Le password non coincidono.');
      valid = false;
    }

    return valid;
  }
}

/**
 * Serializza il form in un oggetto `IUserRegistration` esplicitamente tipato.
 * Questo permette al compilatore di verificare che il risultato rispetti l'interfaccia.
 * 
 */
function serializeForm(form: HTMLFormElement): IUserRegistration {
  const fd = new FormData(form);

  // Costruisco esplicitamente l'oggetto address usando IAddress
  const address: IAddress = {
    street: fd.get('address.street')?.toString() || undefined,
    city: fd.get('address.city')?.toString() || undefined,
    zip: fd.get('address.zip')?.toString() || undefined,
    province: fd.get('address.province')?.toString() || undefined,
  };

  const acceptRaw = fd.get('acceptTerms')?.toString();

  // Costruisco l'oggetto user con i campi previsti da IUserRegistration
  const user: IUserRegistration = {
    firstName: fd.get('firstName')?.toString() || '',
    lastName: fd.get('lastName')?.toString() || '',
    email: fd.get('email')?.toString() || '',
    phone: fd.get('phone')?.toString() || undefined,
    address,
    password: fd.get('password')?.toString() || '',
    confirmPassword: fd.get('confirmPassword')?.toString() || undefined,
    acceptTerms: acceptRaw === 'on' || acceptRaw === 'true',
  };

  // Se l'indirizzo è completamente vuoto, lo rimuovo
  if (!address.street && !address.city && !address.zip && !address.province) {
    user.address = undefined;
  }

  return user;
}

/**
 * Inizializza gli handler del form: submit, toggle password, ecc.
 * La funzione non invia nulla al server: al momento logga il payload e mostra
 * un toast di successo (se presente nel DOM). 
 * 
 */
export function init() {
  const form = document.getElementById('registerForm') as HTMLFormElement | null;
  if (!form) return;

  const validator = new FormValidator(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validator.validate()) {
      const data = serializeForm(form);
      // Per ora logghiamo in console per debug / verifica
      console.log('Form valido, dati:', data);

      // mostra messaggio di successo (toast) e reset form
      try {
        const toastEl = document.getElementById('registerSuccessToast');
        if (toastEl) {
          // @ts-ignore bootstrap namespace
          const bsToast = new (window as any).bootstrap.Toast(toastEl, { delay: 3500 });
          bsToast.show();
        }
      } catch (err) { }

      form.reset();

      // Disabilita il bottone di submit per evitare invii multipli (simulazione)
      const btn = document.getElementById('btnRegister') as HTMLButtonElement | null;
      if (btn) btn.disabled = true;
      setTimeout(() => { if (btn) btn.disabled = false; }, 800);
    } else {
      // Se invalidi, porta il focus sul primo campo invalido
      const inv = form.querySelector('.is-invalid') as HTMLElement | null;
      if (inv) inv.focus();
    }
  });

  // Toggle visibilità password
  const toggle = document.getElementById('togglePwd') as HTMLButtonElement | null;
  if (toggle) {
    toggle.addEventListener('click', () => {
      const pwd = document.getElementById('password') as HTMLInputElement | null;
      if (!pwd) return;
      pwd.type = pwd.type === 'password' ? 'text' : 'password';
      toggle.textContent = pwd.type === 'password' ? 'Mostra' : 'Nascondi';
    });
  }
}

// auto init quando viene caricato il bundle nel browser
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => init());
}
