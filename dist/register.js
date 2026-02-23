/**
 * Recupera il valore testuale di un campo del form.
 * Ritorna stringa vuota se il campo non esiste.
 */
function getInputValue(form, name) {
    const el = form.elements.namedItem(name);
    return el ? el.value.trim() : '';
}
/**
 * Marca un elemento come invalido e, se presente, popola il messaggio
 * di `.invalid-feedback` nel gruppo di controllo.
 * Supporta anche RadioNodeList (gruppi radio).
 */
function setInvalid(el, message) {
    var _a;
    if (!el)
        return;
    let inputEl = null;
    if (el instanceof Element) {
        inputEl = el;
    }
    else {
        // RadioNodeList 
        const r = el;
        inputEl = (r && r.length && typeof r.item === 'function') ? r.item(0) : null;
    }
    if (!inputEl)
        return;
    // Aggiunge classe standard di bootstrap per il campo invalido
    inputEl.classList.add('is-invalid');
    // Prova a trovare un contenitore che contenga .invalid-feedback
    const group = inputEl.closest('.mb-2, .form-group, .field-with-star, .form-check, .form-floating');
    let fb = null;
    if (group)
        fb = group.querySelector('.invalid-feedback');
    if (!fb)
        fb = (_a = inputEl.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector('.invalid-feedback');
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
function clearInvalid(form) {
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    // nascondi i messaggi di feedback precedenti
    form.querySelectorAll('.invalid-feedback').forEach(fb => fb.classList.remove('d-block'));
}
/**
 * Validatore minimale che lavora sul DOM del form.
 * Nota: non trasforma i dati, solo controlla la presenza e alcune regole basilari.
 */
export class FormValidator {
    constructor(form) { this.form = form; }
    /** Esegue la validazione e ritorna true se il form è valido */
    validate() {
        clearInvalid(this.form);
        let valid = true;
        // Campi obbligatori: elenco di nomi 
        const requiredNames = ['firstName', 'lastName', 'email', 'address.street', 'address.city', 'password', 'confirmPassword', 'acceptTerms'];
        requiredNames.forEach(name => {
            const value = getInputValue(this.form, name);
            if (name === 'acceptTerms') {
                // checkbox termini
                const cb = this.form.elements.namedItem(name);
                if (!cb || !cb.checked) {
                    setInvalid(cb, 'Devi accettare i termini.');
                    valid = false;
                }
                return;
            }
            if (!value) {
                const el = this.form.elements.namedItem(name);
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
            }
            else {
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
function serializeForm(form) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const fd = new FormData(form);
    // Costruisco esplicitamente l'oggetto address usando IAddress
    const address = {
        street: ((_a = fd.get('address.street')) === null || _a === void 0 ? void 0 : _a.toString()) || undefined,
        city: ((_b = fd.get('address.city')) === null || _b === void 0 ? void 0 : _b.toString()) || undefined,
        zip: ((_c = fd.get('address.zip')) === null || _c === void 0 ? void 0 : _c.toString()) || undefined,
        province: ((_d = fd.get('address.province')) === null || _d === void 0 ? void 0 : _d.toString()) || undefined,
    };
    const acceptRaw = (_e = fd.get('acceptTerms')) === null || _e === void 0 ? void 0 : _e.toString();
    // Costruisco l'oggetto user con i campi previsti da IUserRegistration
    const user = {
        firstName: ((_f = fd.get('firstName')) === null || _f === void 0 ? void 0 : _f.toString()) || '',
        lastName: ((_g = fd.get('lastName')) === null || _g === void 0 ? void 0 : _g.toString()) || '',
        email: ((_h = fd.get('email')) === null || _h === void 0 ? void 0 : _h.toString()) || '',
        phone: ((_j = fd.get('phone')) === null || _j === void 0 ? void 0 : _j.toString()) || undefined,
        address,
        password: ((_k = fd.get('password')) === null || _k === void 0 ? void 0 : _k.toString()) || '',
        confirmPassword: ((_l = fd.get('confirmPassword')) === null || _l === void 0 ? void 0 : _l.toString()) || undefined,
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
    const form = document.getElementById('registerForm');
    if (!form)
        return;
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
                    const bsToast = new window.bootstrap.Toast(toastEl, { delay: 3500 });
                    bsToast.show();
                }
            }
            catch (err) { }
            form.reset();
            // Disabilita il bottone di submit per evitare invii multipli (simulazione)
            const btn = document.getElementById('btnRegister');
            if (btn)
                btn.disabled = true;
            setTimeout(() => { if (btn)
                btn.disabled = false; }, 800);
        }
        else {
            // Se invalidi, porta il focus sul primo campo invalido
            const inv = form.querySelector('.is-invalid');
            if (inv)
                inv.focus();
        }
    });
    // Toggle visibilità password
    const toggle = document.getElementById('togglePwd');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const pwd = document.getElementById('password');
            if (!pwd)
                return;
            pwd.type = pwd.type === 'password' ? 'text' : 'password';
            toggle.textContent = pwd.type === 'password' ? 'Mostra' : 'Nascondi';
        });
    }
}
// auto init quando viene caricato il bundle nel browser
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => init());
}
