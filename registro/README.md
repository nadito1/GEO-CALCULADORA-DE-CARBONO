# Registro central en Google Sheets

Con esto, cada carga que se hace en la app queda guardada en una planilla de Google, con fecha y usuario. Todos los que tengan la app conectada ven los datos de todas las plantas.

La planilla tiene dos hojas, que se crean solas:

- **Plantas:** una fila por planta y período con el último estado: Alcance 1, 2 y 3, total, producción, intensidad, quién actualizó y cuándo.
- **Historial:** una fila por cada guardado o baja. No se borra nunca, así queda el registro completo de quién cargó qué.

## Puesta en marcha (una sola vez, ~10 minutos)

1. **Creá la planilla:** en Google Drive, *Nuevo → Hojas de cálculo de Google*. Ponele un nombre, por ejemplo *Huella de Carbono – Registro*.
2. **Abrí el editor de scripts:** en la planilla, *Extensiones → Apps Script*.
3. **Pegá el código:** borrá lo que aparece y pegá todo el contenido de [`Codigo.gs`](Codigo.gs).
4. **Elegí el código de acceso:** en la línea `const CODIGO_ACCESO = 'CAMBIAR-ESTE-CODIGO';`, reemplazá el texto entre comillas por un código propio (por ejemplo `huella-geo-2026`). Guardá con el ícono del disquete.
5. **Publicá:** *Implementar → Nueva implementación*.
   - En el engranaje de *Tipo*, elegí **Aplicación web**.
   - *Ejecutar como:* **Yo**.
   - *Quién tiene acceso:* **Cualquier usuario**. Es necesario para que la app pueda escribir; los datos igual quedan protegidos por el código de acceso.
   - Tocá *Implementar*, autorizá los permisos con tu cuenta de Google y **copiá la URL** que termina en `/exec`.
6. **Conectá la app:** en *Configuración → Registro central*, pegá la URL, el código de acceso y tu nombre, y tocá **Guardar y conectar**. Arriba a la derecha tiene que aparecer **✅ Sincronizado**.

Cada persona que use la app hace solo el paso 6, con la misma URL y el mismo código.

## Si cambiás el código del script

Cada vez que modifiques `Codigo.gs`: *Implementar → Gestionar implementaciones → editar (lápiz) → Versión: Nueva versión → Implementar*. La URL no cambia.

## Seguridad

- El código de acceso es el único filtro. Compartilo solo con quien tenga que cargar datos y cambialo si se filtra; después hay que volver a cargarlo en cada celular.
- Cualquiera con el código puede cargar o editar cualquier planta. El **Historial** deja registrado quién hizo cada cambio y guarda una copia de los datos anteriores.
- Si más adelante se necesitan permisos por planta (que cada planta solo edite lo suyo), el paso siguiente es migrar a una base de datos con usuarios.
