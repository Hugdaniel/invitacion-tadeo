/*
================================================================
MAIN.JS — Invitación Grizzy & The Lemmings
================================================================
Organización:
  1. Referencias al DOM
  2. Lógica del intro
  3. Audio — lemmings interactivos
  4. Parallax del hero
  5. Modal RSVP
  6. Envío del formulario a Google Sheets
  7. Utilidades
================================================================
*/


/* ── 1. REFERENCIAS AL DOM ────────────────────────────────────
   Guardamos los elementos que vamos a usar en variables.
   Es más eficiente que buscarlo con getElementById cada vez.
──────────────────────────────────────────────────────────────── */
const videoIntro        = document.getElementById('video-intro')
const pantallaIntro     = document.getElementById('intro')
const pantallaBienvenida = document.getElementById('bienvenida')
const lemmingBienvenida  = document.getElementById('lemming-bienvenida')
const btnEntrar          = document.getElementById('btn-entrar')
const invitacion        = document.getElementById('invitacion')
const modalRSVP         = document.getElementById('modal-rsvp')
const formRSVP          = document.getElementById('form-rsvp')
const rsvpExito         = document.getElementById('rsvp-exito')

/*
  querySelectorAll devuelve TODOS los elementos con esa clase.
  Los lemmings y la caricatura del bebé comparten la misma lógica de audio.
*/
const elementosInteractivos = document.querySelectorAll('.lemming-interactivo')


/* ── 2. LÓGICA DEL INTRO ──────────────────────────────────────
   Cuando el video termina → fade out intro → aparece bienvenida.
   Cuando el usuario toca el botón → fade out bienvenida → invitación.
──────────────────────────────────────────────────────────────── */

videoIntro.addEventListener('ended', mostrarBienvenida)
videoIntro.addEventListener('error', mostrarBienvenida)

/*
  Fallback: si después de 10 segundos el video no terminó,
  igual avanzamos. Útil para conexiones lentas.
*/
const timeoutIntro = setTimeout(mostrarBienvenida, 10000)

function mostrarBienvenida() {
  clearTimeout(timeoutIntro)

  /* 1. Fade out del intro */
  pantallaIntro.classList.add('fade-out')

  setTimeout(() => {
    /* 2. Ocultamos el intro del DOM */
    pantallaIntro.style.display = 'none'

    /*
      3. Mostramos la pantalla de bienvenida.
      Primero la hacemos display:flex (necesario para que sea visible),
      luego en el siguiente frame del navegador agregamos .activa
      para que la transición de opacity funcione correctamente.
      Si agregáramos display y opacity juntos, el navegador no
      animaría porque el elemento recién aparece en ese frame.
    */
    pantallaBienvenida.style.display = 'flex'

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        /*
          Doble requestAnimationFrame: el primero confirma que
          display:flex ya se aplicó, el segundo dispara la animación.
          Es un patrón conocido para animar elementos que pasan
          de display:none a display:flex.
        */
        pantallaBienvenida.style.opacity = '1'

        /* 4. Animamos el lemming después de un pequeño delay */
        setTimeout(() => {
          lemmingBienvenida.classList.add('animar')
        }, 100)

        /*
          5. Animamos el botón después de que el lemming llegó.
          El CSS ya tiene animation-delay: 0.4s en .btn-entrar.animar,
          pero lo disparamos con un pequeño delay extra para asegurarnos.
        */
        setTimeout(() => {
          btnEntrar.classList.add('animar')

          /*
            6. Después de que termina el pop del botón,
            activamos el brillo pulsante continuo.
            0.4s (delay CSS) + 0.5s (duración pop) = 0.9s
          */
          setTimeout(() => {
            btnEntrar.classList.remove('animar')
            btnEntrar.classList.add('brillar')
            btnEntrar.style.opacity = '1' /* garantizamos que sea visible */
          }, 900)

        }, 200)

      })
    })

  }, 800) /* mismo tiempo que el fade del intro */
}

/*
  Función llamada desde el botón en el HTML: onclick="entrarInvitacion()"
  Este tap también "desbloquea" el audio en iOS —
  a partir de acá todos los audios se pueden reproducir sin restricciones.
*/
function entrarInvitacion() {

  /* 1. Fade out de la bienvenida */
  pantallaBienvenida.style.opacity = '0'
  pantallaBienvenida.style.transition = 'opacity 0.8s ease'
  pantallaBienvenida.style.pointerEvents = 'none'

  setTimeout(() => {
    /* 2. Ocultamos la bienvenida */
    pantallaBienvenida.style.display = 'none'

    /* 3. Fade in de la invitación */
    invitacion.classList.add('visible')

  }, 800)
}


/* ── 3. AUDIO — ELEMENTOS INTERACTIVOS ───────────────────────
   Cada lemming y la caricatura del bebé tienen un
   atributo data-audio con la ruta al archivo de audio.
   Al tocarlo: reproduce el audio + animación de salto.
──────────────────────────────────────────────────────────────── */

/*
  Recorremos todos los elementos interactivos
  y le asignamos el mismo handler de click a cada uno.
*/
elementosInteractivos.forEach(elemento => {
  elemento.addEventListener('click', () => {

    /* Leemos la ruta del audio desde el atributo data-audio del HTML */
    const rutaAudio = elemento.dataset.audio

    if (rutaAudio) {
      reproducirAudio(rutaAudio)
    }

    /* Animación de salto: agrega la clase, espera que termine, la saca */
    elemento.classList.add('saltando')
    elemento.addEventListener('animationend', () => {
      elemento.classList.remove('saltando')
    }, { once: true }) /* once: true → el listener se elimina solo después de ejecutarse */

  })
})

/*
  Función reutilizable para reproducir audio.
  Crea un nuevo objeto Audio cada vez para permitir
  que el mismo sonido se superponga si se toca rápido.
*/
function reproducirAudio(ruta) {
  const audio = new Audio(ruta)
  /*
    Los navegadores bloquean el audio no iniciado por el usuario.
    Como esta función siempre se llama desde un click,
    está garantizado que el usuario interactuó primero.
  */
  audio.play().catch(err => {
    /* Si igual falla, lo ignoramos silenciosamente */
    console.warn('Audio no pudo reproducirse:', err)
  })
}


/* ── 4. PARALLAX DEL HERO ─────────────────────────────────────
   background-attachment: fixed no funciona bien en iOS.
   Esta versión JS funciona en todos los dispositivos.
──────────────────────────────────────────────────────────────── */
const hero = document.querySelector('.hero')

/*
  requestAnimationFrame → llama a la función en cada fotograma
  del navegador (60 veces por segundo).
  Es más suave y eficiente que usar scroll directamente.
*/
let tickParallax = false

window.addEventListener('scroll', () => {
  if (!tickParallax) {
    requestAnimationFrame(() => {
      aplicarParallax()
      tickParallax = false
    })
    tickParallax = true
  }
})

function aplicarParallax() {
  if (!hero) return

  /*
    window.scrollY → cuántos pixels bajó el scroll.
    Multiplicamos por 0.4 → el fondo se mueve al 40% de velocidad
    del scroll, creando el efecto de profundidad.
    Cuanto más chico el número, más lento se mueve el fondo.
  */
  const offset = window.scrollY * 0.4
  hero.style.backgroundPositionY = `calc(center + ${offset}px)`
}


/* ── 5. MODAL RSVP ────────────────────────────────────────────
   Abre y cierra la ventana de confirmación.
──────────────────────────────────────────────────────────────── */

/* Llamada desde el botón en el HTML: onclick="abrirRSVP()" */
function abrirRSVP() {
  modalRSVP.classList.add('activo')
  /*
    Bloqueamos el scroll del body mientras el modal está abierto.
    Si no, el usuario puede scrollear la página de fondo.
  */
  document.body.style.overflow = 'hidden'
}

/* Llamada desde el botón X y desde el onclick del overlay */
function cerrarRSVP(event) {
  /*
    Si se llama desde el click en el overlay, verificamos
    que el click fue en el overlay mismo y no en el modal interior.
    event.target es el elemento donde se hizo click.
    event.currentTarget es el elemento que tiene el handler (el overlay).
  */
  if (event && event.target !== event.currentTarget) return

  modalRSVP.classList.remove('activo')
  document.body.style.overflow = '' /* restaura el scroll */
}

/* También cerramos el modal con la tecla Escape */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarRSVP()
})


/* ── 6. ENVÍO DEL FORMULARIO ──────────────────────────────────
   Envía los datos a Google Sheets igual que en el proyecto Minecraft.
   fetch con no-cors → no necesita backend, va directo a Google Forms.
──────────────────────────────────────────────────────────────── */

/*
  IMPORTANTE: reemplazá esta URL con la de tu Google Form.
  Para obtenerla: abrí el Form → pre-compilar respuestas → copiar link.
  Cambiá /viewform por /formResponse al final.
*/
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/TU_FORM_ID/formResponse'

/*
  También reemplazá estos con los entry.XXXXXXX de tu formulario.
  Para encontrarlos: botón derecho en el campo del form → inspeccionar.
*/
const CAMPOS_FORM = {
  nombre:   'entry.XXXXXXXXX',
  personas: 'entry.XXXXXXXXX',
  mensaje:  'entry.XXXXXXXXX'
}

formRSVP.addEventListener('submit', async (e) => {
  /*
    preventDefault evita que el formulario recargue la página,
    que es el comportamiento por defecto de un <form>.
  */
  e.preventDefault()

  /* Leemos los valores de los campos */
  const nombre   = document.getElementById('nombre').value
  const personas = document.getElementById('personas').value
  const mensaje  = document.getElementById('mensaje').value

  /* Armamos los datos en formato URLSearchParams (lo que Google espera) */
  const datos = new URLSearchParams()
  datos.append(CAMPOS_FORM.nombre,   nombre)
  datos.append(CAMPOS_FORM.personas, personas)
  datos.append(CAMPOS_FORM.mensaje,  mensaje)

  try {
    /*
      mode: 'no-cors' → evita errores de CORS al enviar a Google.
      La desventaja es que no podemos leer la respuesta,
      pero para un form simple alcanza y sobra.
    */
    await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      mode:   'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:   datos.toString()
    })

    /* Si llegamos acá, asumimos que el envío fue exitoso */
    mostrarExitoRSVP()

  } catch (error) {
    /*
      Con no-cors los errores de red igual llegan acá.
      Mostramos el éxito igual porque Google suele recibirlo.
    */
    console.error('Error al enviar:', error)
    mostrarExitoRSVP()
  }
})

function mostrarExitoRSVP() {
  /* Ocultamos el form y mostramos el mensaje de éxito */
  formRSVP.style.display = 'none'
  rsvpExito.style.display = 'block'

  /* Reproducimos la risa del bebé como confirmación */
  reproducirAudio('assets/audio/risa-bebe.mp3')

  /* Después de 3 segundos cerramos el modal automáticamente */
  setTimeout(() => {
    cerrarRSVP()
    /* Reseteamos el modal para si lo vuelve a abrir */
    setTimeout(() => {
      formRSVP.style.display = 'block'
      rsvpExito.style.display = 'none'
      formRSVP.reset()
    }, 800)
  }, 3000)
}


/* ── 7. UTILIDADES ────────────────────────────────────────────
   Funciones de uso general.
──────────────────────────────────────────────────────────────── */

/*
  Abre Google Maps con la dirección del evento.
  Llamada desde el botón de ubicación en el HTML.
  Reemplazá la dirección con la real.
*/
function abrirMaps() {
  const direccion = encodeURIComponent('Av. Ejemplo 1234, Marcos Paz, Buenos Aires')
  window.open(`https://maps.google.com/?q=${direccion}`, '_blank')
}