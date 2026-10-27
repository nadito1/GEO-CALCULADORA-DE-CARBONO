# 🏭 Georgalos · Huella de Carbono

Web app instalable (PWA) para calcular la **huella de carbono de cada planta**, con desglose por alcance del GHG Protocol e indicador de intensidad (kg CO₂e por kg producido).

Cada planta tiene una sola ficha y cada carga indica su **mes**: se puede ver un mes, un año o todo el período, con la evolución mensual por alcance. La importación (Configuración → Importar datos) combina cargas en plantas existentes y acepta el formato `{ "plants": [...], "remove": [ids] }` para reemplazar fichas viejas.

## Qué calcula

| Alcance | Fuente | Dato a cargar |
|---|---|---|
| 1 | Gas natural | m³ (factura) |
| 1 | Otros combustibles en planta | L de gasoil, kg de GLP, L de fuel oil |
| 1 | Vehículos propios | L de gasoil / nafta, m³ de GNC |
| 1 | Recarga de refrigerantes | kg por tipo de gas (R-404A, R-507A, amoníaco, etc.) |
| 2 | Electricidad | kWh de red (y renovable certificada, que no suma) |
| 3 · Cat. 7 | **Traslados del personal** | personas y km por trayecto según medio (auto, moto, colectivo, micro de la empresa, remís), días trabajados |
| 3 · Cat. 6 | Viajes de trabajo | km por medio (auto, avión, micro) |
| 3 · Cat. 5 | Residuos | kg según destino (relleno, compost, reciclaje) |
| – | Producción | kg producidos (para la intensidad) |

Traslados: `personas × km por trayecto × 2 × días × factor`. En autos el factor es por km de vehículo y se divide por las personas por auto.

## Factores de emisión

- **Argentina (principal):** [Factores de Emisión GEI SNIGEI-AR para Huella de Carbono, 2025](https://inventariogei.ambiente.gob.ar/files/Factores_de_Emision_SNIGEIAR_para_HC_2025.pdf), de la Subsecretaría de Ambiente de la Nación (datos del Inventario Nacional 2022). Combustibles, red eléctrica, refrigerantes y residuos. PCG IPCC AR5.
- **Transporte de personas por km:** [UK DESNZ – conversion factors 2025](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025), porque no hay factores oficiales argentinos por km.

Todos los factores están en [`src/data/factors/ar.json`](src/data/factors/ar.json) con su fuente; para actualizarlos se edita solo ese archivo. La pestaña **Metodología** de la app los muestra en tablas.

## Registro central

La app se conecta a una planilla de Google que funciona como registro: cada carga se guarda con fecha y usuario (hoja **Plantas** con el último estado y hoja **Historial** con todos los cambios), y todos ven los datos de todas las plantas. Funciona sin conexión y sincroniza cuando vuelve la señal. Puesta en marcha: [`registro/README.md`](registro/README.md).

Sin registro conectado, los datos quedan en el dispositivo y se pueden exportar e importar desde **Configuración**.

## Marca

Paleta Georgalos definida en [`src/index.css`](src/index.css): violeta `#6A2C91`, rojo `#E2231A`, gris `#595959`. Para usar el logo oficial, copiá el archivo a `public/` (por ejemplo `public/georgalos-logo.png`) y poné su nombre en `BRAND_LOGO` dentro de [`src/config.ts`](src/config.ts). En ese mismo archivo, `REGISTRO_URL` deja fija la URL del registro para que nadie tenga que pegarla.

## Desarrollo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

Al hacer push a `master`, GitHub Actions publica la app en GitHub Pages (hay que activar Pages con origen "GitHub Actions" en Settings → Pages).

Stack: Preact, TypeScript, Tailwind CSS, Vite, vite-plugin-pwa, Recharts.

## Licencia y créditos

[MIT](LICENSE). Basado en [Carbon Calculator](https://github.com/tfobz/carbon-calculator), desarrollado por estudiantes de la TFO "Max Valier" (Bolzano) en el marco de Erasmus+.
