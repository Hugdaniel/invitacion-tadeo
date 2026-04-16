/*
================================================================
MAIN.JS — Invitación Grizzy & The Lemmings — v2
================================================================
Organización:
  1. Referencias al DOM
  2. Intro — capa logo → capa personajes → invitación
  3. Audio — todos los elementos interactivos
  4. Parallax del hero (compatible iOS)
  5. IntersectionObserver — animación final
  6. Modal RSVP
  7. Envío del formulario a Google Sheets
  8. Utilidades
================================================================
*/


/* ── 1. REFERENCIAS AL DOM ─────────────────────────────────────
   Variables para cada elemento que JS necesita manipular.
   Guardarlo en variables es más eficiente que buscarlo cada vez.
─────────────────────────────────────────────────────────────── */
const introLogo         = document.getElementById('intro-logo')
const introPersonajes   = document.getElementById('intro-personajes')
const videoLogo         = document.getElementById('video-logo')
const btnEntrar         = document.getElementById('btn-entrar')
const invitacion        = document.getElementById('invitacion')
const modalRSVP         = document.getElementById('modal-rsvp')
const formRSVP          = document.getElementById('form-rsvp')
const rsvpExito         = document.getElementById('rsvp-exito')
const hero              = document.querySelector('.hero')
const animacionFinal    = document.getElementById('animacion-final')
const videoPersonajes = document.querySelector('.personajes-animacion video')

/*
  Todos los elementos con .lemming-interactivo comparten
  la misma lógica de audio y animación de salto.
  Incluye: lemmings de costado, lemmings de datos y caricatura del bebé.
*/
const elementosInteractivos = document.querySelectorAll('.lemming-interactivo')


/* ── 2. INTRO — TRANSICIÓN EN DOS CAPAS ───────────────────────

  FLUJO COMPLETO:
  ┌─────────────────────────────────────────────────────┐
  │ Video logo termina                                  │
  │   → fade out capa logo                              │
  │   → fade in capa personajes                         │
  │   → lemming aparece (ya está en la animación)       │
  │   → botón hace pop con rebote                       │
  │   → botón empieza a brillar                         │
  │                                                     │
  │ Usuario toca "Ver la invitación"                    │
  │   → fade out intro completo                         │
  │   → fade in invitación                              │
  │   → audio desbloqueado en iOS ✓                    │
  └─────────────────────────────────────────────────────┘
─────────────────────────────────────────────────────────────── */

/* El video del logo dispara la transición al terminar */
videoLogo.addEventListener('ended', mostrarPersonajes)

/* Fallback: si el video falla, igual avanzamos */
videoLogo.addEventListener('error', mostrarPersonajes)

/*
  Fallback de tiempo: si a los 10 segundos el video
  no terminó (conexión lenta), avanzamos igual.
*/
const timeoutLogo = setTimeout(mostrarPersonajes, 10000)

function mostrarPersonajes() {
  /*
    clearTimeout evita que se ejecute dos veces
    si el video terminó normalmente antes del timeout.
  */
  clearTimeout(timeoutLogo)

  /* 1. Fade out de la capa del logo */
  introLogo.classList.add('fade-out')

  setTimeout(() => {
    /* 2. Ocultamos la capa del logo del flujo visual */
    introLogo.style.display = 'none'

    /*
      3. Mostramos la capa de personajes.
      Primero display:flex, luego en el siguiente frame
      agregamos .visible para que la transición de opacity funcione.
      Si cambiamos display y opacity juntos en el mismo frame,
      el navegador no anima porque el elemento recién aparece.
    */
    introPersonajes.classList.add('activo')

    /*
      doble requestAnimationFrame: técnica estándar para animar
      elementos que pasan de display:none a display:flex.
      El primer frame confirma que display:flex se aplicó,
      el segundo dispara la transición de opacity.
    */
    requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    introPersonajes.classList.add('visible')
    videoPersonajes.addEventListener('timeupdate', () => {
  /*
    timeupdate se dispara continuamente mientras el video avanza.
    duration → duración total del video en segundos.
    currentTime → segundo actual del video.
    Cuando quedan 1.5s (mismo tiempo que el transition CSS),
    arrancamos el fade out.
  */
  const tiempoRestante = videoPersonajes.duration - videoPersonajes.currentTime

  if (tiempoRestante <= 1.5) {
    videoPersonajes.classList.add('desvaneciendo')
  }
})

    setTimeout(() => {                    // ← abre setTimeout OVERLAY (espera 600ms)

      document.getElementById('personajes-overlay').classList.add('oscurecer')

      setTimeout(() => {                  // ← abre setTimeout BOTÓN (espera 1000ms más)

        btnEntrar.classList.add('animar')

        setTimeout(() => {                // ← abre setTimeout BRILLO (espera 800ms más)
          btnEntrar.classList.remove('animar')
          btnEntrar.classList.add('brillar')
        }, 800)                           // ← cierra setTimeout BRILLO

      }, 1000)                            // ← cierra setTimeout BOTÓN

    }, 600)                               // ← cierra setTimeout OVERLAY

  })                                      // ← cierra segundo requestAnimationFrame
})                                        // ← cierra primer requestAnimationFrame

  }, 800) /* mismo tiempo que el fade del logo */
}


/*
  Llamada desde el botón en el HTML: onclick="entrarInvitacion()"

  Este tap es CLAVE para iOS:
  → el primer tap del usuario desbloquea el motor de audio del navegador.
  → a partir de acá todos los Audio.play() funcionan sin restricciones.
*/
function entrarInvitacion() {

  // Arranca la música cuando el usuario toca el botón
  // Este tap ya desbloqueó el audio en iOS, así que play() funciona seguro
  const musicaFondo = document.getElementById('musica-fondo')
  musicaFondo.volume = 0        // empieza en silencio
  musicaFondo.play()

  // Fade in del volumen suave — sube de 0 a 0.4 en 2 segundos
  // No queremos que explote de golpe
  fadeVolumen(musicaFondo, 0, 0.4, 2000)



  /* 1. Fade out del intro completo (capa de personajes) */
  introPersonajes.classList.add('fade-out')

  setTimeout(() => {

    /* 2. Ocultamos el intro completo */
    document.getElementById('intro').style.display = 'none'

    /* 3. Fade in de la invitación */
    invitacion.classList.add('visible')

    /*
      4. Iniciamos el parallax ahora que la invitación es visible.
      Si lo iniciáramos antes, los cálculos de posición serían incorrectos
      porque el elemento no ocupaba espacio en pantalla.
    */
    iniciarParallax()

     /*
      Iniciamos el observer del chat AQUÍ, después de que
      la invitación es visible. Si lo iniciamos antes,
      el navegador detecta todas las filas como visibles
      porque el elemento padre no ocupaba espacio en pantalla.
    */
    iniciarObserverChat()

  }, 800)
}


/* ── 3. AUDIO — ELEMENTOS INTERACTIVOS ─────────────────────────
   Cada elemento con .lemming-interactivo tiene data-audio
   con la ruta al archivo mp3.
   Al tocarlo: reproduce el audio + animación de salto.
─────────────────────────────────────────────────────────────── */

elementosInteractivos.forEach(elemento => {
  elemento.addEventListener('click', () => {

    /* Lee la ruta del audio del atributo data-audio en el HTML */
    const ruta = elemento.dataset.audio
    if (ruta) reproducirAudio(ruta)

    /*
      Determina si es el lemming derecho (espejado).
      Necesitamos una animación diferente porque tiene scaleX(-1).
    */
    const esDerecho = elemento.classList.contains('lemming-der')

    /*
      Agrega la clase de salto correcta.
      { once: true } → el listener se elimina solo después de ejecutarse,
      evitando acumulación de listeners en cada click.
    */
    if (esDerecho) {
      elemento.classList.add('saltando') /* CSS tiene keyframe especial para .lemming-der.saltando */
    } else {
      elemento.classList.add('saltando')
    }

    elemento.addEventListener('animationend', () => {
      elemento.classList.remove('saltando')
    }, { once: true })

  })
})

/*
  Función reutilizable para reproducir audio.
  Crea un new Audio() cada vez → permite que el mismo
  sonido se superponga si se toca rápido (varios lemmings).
*/
function reproducirAudio(ruta) {
  const audio = new Audio(ruta)
  audio.play().catch(err => {
    /*
      Si el audio falla, lo ignoramos silenciosamente.
      No queremos que un error de audio rompa la experiencia.
    */
    console.warn('Audio no reproducido:', err)
  })
}


/* ── 4. PARALLAX DEL HERO ──────────────────────────────────────
   background-attachment:fixed no funciona en iOS Safari.
   Este parallax JS funciona en todos los dispositivos.
   Se inicia recién cuando la invitación es visible.
─────────────────────────────────────────────────────────────── */
let parallaxActivo = false

function iniciarParallax() {
  parallaxActivo = true
}

/*
  requestAnimationFrame → llama a la función en cada fotograma
  del navegador (~60 veces por segundo).
  tickParallax evita cálculos duplicados en el mismo frame.
*/
let tickParallax = false

window.addEventListener('scroll', () => {
  if (!parallaxActivo) return

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
    window.scrollY → pixels que bajó el scroll.
    × 0.35 → el fondo se mueve al 35% de velocidad del scroll.
    Cuanto más chico el número, más lento y más profundo el efecto.
  */
  const offset = window.scrollY * 0.35
  hero.style.backgroundPositionY = `calc(top + ${offset}px)`
}




/* ── 5. INTERSECTIONOBSERVER — ANIMACIÓN FINAL ─────────────────
   Detecta cuando el usuario llega a la sección final
   y dispara la animación de entrada del oso + lemmings.
─────────────────────────────────────────────────────────────── */

/*
  IntersectionObserver llama al callback cuando el elemento
  entra o sale del viewport (la pantalla visible).
  threshold: 0.3 → se dispara cuando el 30% del elemento es visible.
*/
const observadorFinal = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      /*
        Agrega .visible → CSS hace el fade in + slide up.
        once: después de agregar .visible no necesitamos
        seguir observando, así que desconectamos.
      */
      animacionFinal.classList.add('visible')
      observadorFinal.disconnect()
    }
  })
}, { threshold: 0.3 })

/* Empezamos a observar solo si el elemento existe en el DOM */
if (animacionFinal) {
  observadorFinal.observe(animacionFinal)
}


/* ── 6. MODAL RSVP ─────────────────────────────────────────────
   Abre y cierra la ventana de confirmación de asistencia.
─────────────────────────────────────────────────────────────── */

/* Llamada desde onclick="abrirRSVP()" en el HTML */
function abrirRSVP() {
  modalRSVP.classList.add('activo')
  /*
    Bloquea el scroll del body mientras el modal está abierto.
    Sin esto, el usuario puede scrollear la página de fondo.
  */
  document.body.style.overflow = 'hidden'
}

/* Llamada desde el botón X y desde onclick del overlay */
function cerrarRSVP(event) {
  /*
    Si viene de un click en el overlay, verificamos que el click
    fue en el overlay mismo y no en el modal interior.
    event.target     → donde se hizo el click.
    event.currentTarget → el elemento que tiene el handler.
    Si son distintos, el click fue en el modal (hijo) → no cerramos.
  */
  if (event && event.target !== event.currentTarget) return

  modalRSVP.classList.remove('activo')
  document.body.style.overflow = '' /* restaura el scroll */
}

/* Cerrar con la tecla Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrarRSVP()
})


/* ── 7. ENVÍO A GOOGLE SHEETS ──────────────────────────────────
   Misma técnica que en el proyecto Minecraft.
   fetch con mode:'no-cors' → no necesita backend propio.
─────────────────────────────────────────────────────────────── */

/*
  ⚠️  IMPORTANTE: reemplazá esta URL con la de tu Google Form.
  Pasos:
    1. Creá el formulario en Google Forms con 3 campos.
    2. Hacé clic en "Vista previa" (ojo).
    3. Inspeccioná cada campo → buscá name="entry.XXXXXXX".
    4. Copiá esos valores abajo.
    5. Tomá la URL del form y cambiá /viewform por /formResponse.
*/
const FORM_URL = 'https://docs.google.com/forms/d/16XA8HjuMu3JoyfY2xmMIaxmC4wpeW66_CtOG_9LgU3Q/formResponse'

const ENTRIES = {
  nombre:   'entry.187003640',
  personas: 'entry.1210780225',
  mensaje:  'entry.448228849'
}

formRSVP.addEventListener('submit', async e => {
  /*
    preventDefault → evita que el form recargue la página,
    que es el comportamiento por defecto de HTML.
  */
  e.preventDefault()

  const datos = new URLSearchParams()
  datos.append(ENTRIES.nombre,   document.getElementById('nombre').value)
  datos.append(ENTRIES.personas, document.getElementById('personas').value)
  datos.append(ENTRIES.mensaje,  document.getElementById('mensaje').value)

  datos.append('submit', 'submit')

  try {
    await fetch(FORM_URL, {
      method: 'POST',
      mode:   'no-cors', /* evita errores CORS con Google */
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:   datos.toString()
    })
  } catch (err) {
    /* Con no-cors los errores llegan acá igualmente */
    console.error('Error al enviar RSVP:', err)
  }

  /* Mostramos el éxito independientemente del resultado */
  mostrarExitoRSVP()
})

function mostrarExitoRSVP() {
  formRSVP.style.display = 'none'
  rsvpExito.style.display = 'block'

  /* La risa del bebé como confirmación */
  reproducirAudio('assets/audio/risa-bebe.mp3')

  /* Cerramos el modal a los 3 segundos y reseteamos */
  setTimeout(() => {
    cerrarRSVP()
    setTimeout(() => {
      formRSVP.style.display = 'block'
      rsvpExito.style.display = 'none'
      formRSVP.reset()
    }, 800)
  }, 3000)
}


/* ── 8. UTILIDADES ─────────────────────────────────────────────
   Funciones de uso general expuestas globalmente
   para que el HTML pueda llamarlas con onclick="...".
─────────────────────────────────────────────────────────────── */

/*
  Abre Google Maps con la dirección del evento.
  Reemplazá la dirección con la real.
*/
function abrirMaps() {
  const direccion = encodeURIComponent('Av. Ejemplo 1234, Marcos Paz, Buenos Aires')
  window.open(`https://maps.app.goo.gl/hcFBXJo4r4FCVWr1A`, '_blank')
}

/*
  Sube o baja el volumen gradualmente.
  elemento  → el <audio>
  desde     → volumen inicial (0 = silencio)
  hasta     → volumen final (1 = máximo, 0.4 = suave)
  duracion  → en milisegundos
*/
function fadeVolumen(elemento, desde, hasta, duracion) {
  const pasos = 30                        // cantidad de pasos del fade
  const intervalo = duracion / pasos      // tiempo entre cada paso
  const incremento = (hasta - desde) / pasos

  let volumenActual = desde
  elemento.volume = volumenActual

  const timer = setInterval(() => {
    volumenActual += incremento

    // Clamp: asegura que el volumen no se salga de 0-1
    volumenActual = Math.min(Math.max(volumenActual, 0), 2)
    elemento.volume = volumenActual

    // Cuando llegamos al volumen final, paramos
    if (Math.abs(volumenActual - hasta) < 0.01) {
      clearInterval(timer)
    }
  }, intervalo)
}