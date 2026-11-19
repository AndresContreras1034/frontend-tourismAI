# Tourism AI · Expo Ingeniería

## Ejecutar localmente

```bash
npm ci
npm run dev
```

La versión de exhibición está disponible en `/expo` y `/expo/registro`. El panel
es público y de solo lectura: sus indicadores, puntos del mapa y tokens son datos
de muestra; el perfil opcional se guarda únicamente en el navegador. No crea una
cuenta de backend ni concede permisos administrativos.

El planificador Expo consulta el servicio FastAPI local de `Downloads\ai-service`.
El servicio entrena un recomendador con las calificaciones incluidas en el dataset
y no usa una base de datos. Para ejecutarlo, crea su entorno e inicia la API según
las instrucciones de [ai-service](<../../ai-service/ai-service/README.md>), y luego
inicia este frontend.

El planificador combina presupuesto, compañía y tipos de plan cerrados (cultural,
vida nocturna, naturaleza, gastronomía, relajación y compras) con tres
recomendaciones del modelo ML; la persona elige una antes de pedir a DeepSeek un
itinerario de un día. Incluye estimaciones de comida, bebidas, cerveza y
transporte; restaurantes, curiosidades y consejos; el pronóstico de mañana de
Open-Meteo, adaptación a la lluvia, un índice heurístico del plan y ClaudIA.
El mapa usa Leaflet y OpenStreetMap: las coordenadas provienen de geocodificación
OSM o de un catálogo local aproximado; los parqueaderos son etiquetas OSM y
pueden no reflejar disponibilidad ni tarifas. Esta función requiere
el backend Node de `backend-tourismAI` en el
puerto configurado en `VITE_API_URL` (por defecto `http://127.0.0.1:3000`) y
`DEEPSEEK_API_KEY` configurada solo en el `.env` del backend. Consulta su
[README](../../backend-tourismAI/README.md) para iniciarlo. No pongas la clave en
el frontend.

Los planes y resultados ML se guardan en el `localStorage` del dispositivo. Se
envían al backend la experiencia elegida, el presupuesto, la compañía, el tipo de
plan y las fichas locales pertinentes; no se envía el perfil de muestra. Las
fotos que se adjuntan a ClaudIA (JPEG, PNG, GIF o WebP, máximo 5 MB) se envían a
DeepSeek para analizarlas, pero no se almacenan en el servidor. Las líneas del
mapa son secuencias geográficas entre paradas, no navegación vial. Los precios y
pasajes son estimaciones; confirma rutas, operación, acceso a parqueaderos y
tarifas antes de viajar.

## Build y lint

```bash
npm run build
npm run lint
```

## Publicar el frontend en Vercel

Importa este directorio como proyecto Vite en Vercel. Usa `npm run build` como
comando de build y `dist` como directorio de salida. `vercel.json` configura el
fallback de rutas para que `/expo` y `/expo/registro` funcionen al abrirse
directamente.

La publicación estática incluye la experiencia Expo; no despliega el backend, la
base de datos ni el servicio FastAPI del recomendador. Aloja esos servicios por
separado, configura `VITE_API_URL` con la URL pública del backend y configura sus
variables secretas en el proveedor correspondiente. No publiques archivos `.env`
ni uses una URL local como API de producción.
