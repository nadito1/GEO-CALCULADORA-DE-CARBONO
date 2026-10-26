# 🏭 GEO Calculadora de Carbono

Web app instalable (PWA) para calcular la **huella de carbono de cada planta**, con desglose por alcance del GHG Protocol e indicador de intensidad (kg CO₂e por kg producido).

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

## Cómo se usan los datos

Cada dispositivo guarda sus datos localmente. Para consolidar todas las plantas: cada planta exporta su archivo desde **Configuración** y quien consolida los importa (las plantas nuevas se agregan, las existentes se actualizan).

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
