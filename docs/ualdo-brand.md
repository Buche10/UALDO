# Manual de marca Ualdo para desarrollo

Referencia obligatoria para cualquier interfaz, texto o recurso visual de este proyecto.
Fuente: Manual de Marca Ualdo (jul 2026) y ualdocorp.com (sep 2026).

## 0. Regla absoluta: cero emojis

Prohibido usar emojis en cualquier parte: interfaz, textos, código, comentarios, logs, mensajes de consola,
commits, documentación, tests, datos semilla y nombres de archivo. Sin excepciones, aunque el manual de marca o la web los usen.
Para iconos usa SVG (por ejemplo Lucide o Heroicons) con los colores de la paleta.

## 1. Colores

```css
:root {
  --ualdo-negro:     #1d1d1b; /* texto principal sobre claro */
  --ualdo-petroleo:  #00737f; /* botones primarios, enlaces, texto de acento sobre claro */
  --ualdo-turquesa:  #2d9ba1; /* acentos, títulos grandes sobre claro */
  --ualdo-aqua:      #62c9c8; /* acentos gráficos; títulos sobre oscuro */
  --ualdo-pizarra:   #3b515b; /* fondo oscuro principal */
  --ualdo-blanco:    #ffffff;
}
```

No uses colores fuera de esta paleta, salvo grises neutros derivados de `--ualdo-negro` para bordes y estados deshabilitados, y los colores semánticos de error, éxito y aviso cuando la interfaz lo exija.

Contraste de texto (WCAG AA):

| Fondo | Texto permitido | Nunca |
|---|---|---|
| Blanco | `#1d1d1b`, `#00737f`; `#2d9ba1` solo en títulos grandes | `#62c9c8` como texto |
| `#3b515b` | Blanco; `#62c9c8` en títulos y palabras destacadas | Negro |
| `#1d1d1b` | Blanco, `#62c9c8` | Petróleo en texto pequeño |

Fondos claros: blanco o blanco con un tinte aqua sutil (degradado hacia `#62c9c8` al 10-15 %).

## 2. Tipografía

- Única familia: **Poppins**, cargada desde Google Fonts. Secundaria solo para textos largos: **Asap**.
- Títulos de sección: Poppins 700-800, en aqua sobre oscuro o en turquesa/petróleo sobre claro.
- Titulares de impacto: Poppins 800, en negro o blanco, con la palabra clave en aqua o turquesa.
- Cuerpo: Poppins 300-400, siempre alineado a la izquierda (nunca justificado).
- Notas y pies: Poppins 300, tamaño pequeño.

## 3. Logotipo

- Composición: el isotipo a la izquierda y "Ualdo." a la derecha. Nunca pongas el isotipo a la derecha del texto.
- Colores del logotipo: la "U" en aqua, "aldo" en negro y el punto en petróleo. Sobre fondo oscuro: "aldo" y el punto en blanco.
- Versiones permitidas: horizontal completo, solo logotipo, solo isotipo y monograma "U." (para favicon o avatar).
- Tamaño mínimo digital: 100x24 px el horizontal, 50x50 px el isotipo o el monograma. Por debajo de eso, usa solo el monograma.
- Área de seguridad: como mínimo 1X por lado (X es 1/4 de la altura del logo).
- Prohibido: deformarlo, rotarlo, invertirlo, recolorearlo, ponerle sombras, contornos o degradados, o colocarlo sobre fotos recargadas.
- Usa siempre los archivos oficiales de `docs/brand-assets/`. No los redibujes, no los recrees en SVG o CSS y no los edites. Si necesitas otro formato (SVG, favicon, monograma "U."), no lo inventes: indícalo en el resumen final.

### Assets oficiales (`docs/brand-assets/`, PNG con fondo transparente)

| Archivo | Qué es | Dónde usarlo |
|---|---|---|
| `ualdo-logo-horizontal-fondo-claro.png` | Isotipo + "Ualdo.", con texto negro (2200x886) | Fondos blancos o claros |
| `ualdo-logo-horizontal-fondo-oscuro.png` | "Ualdo." con la U aqua y "aldo." en blanco (1200x744) | Fondos `#3b515b` o `#1d1d1b` |
| `ualdo-isotipo.png` | Solo el isotipo (1040x942) | Favicon, avatar, espacios pequeños, patrones |
| `ualdo-mascota.png` | Personaje UALDO (961x839) | Onboarding, Academia, estados vacíos; nunca en pantallas institucionales |

- Copia los assets a la carpeta pública del proyecto (`public/`, `assets/`, etc.) según su stack; no enlaces a `docs/` desde la app.
- Sirve los assets con `width`/`height` explícitos y texto `alt` ("Ualdo", "Isotipo de Ualdo", "UALDO, asistente de Ualdo").
- El isotipo tiene margen transparente desigual; ajústalo con CSS (`object-fit`, `object-position`) y no recortes el archivo original.

## 4. Componentes de interfaz

- Formas: esquinas redondeadas; ondas orgánicas en los bordes de secciones grandes.
- Botón primario: pastilla (`border-radius: 9999px`) en petróleo o aqua con texto blanco. Asegura el contraste con texto en negrita o con petróleo.
- Botón secundario: fondo blanco, borde suave y texto petróleo.
- Patrón de fondo: isotipos o "U." en un tono apenas más claro que `#3b515b` (baja opacidad).
- Personaje UALDO: solo con los assets oficiales. Úsalo en onboarding, Academia y estados vacíos; omítelo en pantallas institucionales, legales o para inversores.
- Formularios que recojan datos personales: incluye siempre la casilla de consentimiento conforme a la LOPDP.
- Accesibilidad: foco visible, `alt` en imágenes, etiquetas en todos los inputs, contraste AA.

## 5. Textos y tono

- Ualdo es "una familia de soluciones de IA soberana"; no es un chatbot ni "una herramienta".
- Productos: Ualdo Teams, Ualdo Legal, Ualdo Notarías, Ualdo Cobranzas. Solo Teams está en producción.
- Tutea en la interfaz, la web y las piezas comerciales. Usa "usted" en contratos, documentos legales y material institucional.
- La primera vez, escribe las siglas completas: RGPD (Reglamento General de Protección de Datos de la UE) y LOPDP (Ley Orgánica de Protección de Datos Personales del Ecuador).
- Cumplimiento: di "diseñado conforme a los principios del RGPD y la LOPDP". Nunca uses "certificado", "garantizado" ni "100 % seguro".
- Mensajes de estado: cercanos y claros, sin tecnicismos sin explicar y sin tono alarmista.
- Botones habituales: "Quiero mi demo", "Solicitar información", "Ver los productos", "Soy parte de un equipo".
- Pie de página: "© 2026 Ualdo — Una marca de Santamaría Velasco & Asociados."
- No inventes cifras ni métricas. Nada de lorem ipsum ni textos de plantilla.

## 6. Checklist de marca (la auditoría lo verifica)

- [ ] Cero emojis en todo el diff.
- [ ] Solo colores de la paleta (vía variables CSS o tokens, no valores sueltos repetidos) y contraste AA.
- [ ] Solo Poppins (y Asap para textos largos), cuerpo alineado a la izquierda.
- [ ] Logo oficial, versión permitida, isotipo a la izquierda, tamaño mínimo y área de seguridad.
- [ ] Botones en pastilla y esquinas redondeadas.
- [ ] Textos con el tono y los nombres de producto correctos, sin afirmaciones legales absolutas.
- [ ] Consentimiento LOPDP en formularios con datos personales.
