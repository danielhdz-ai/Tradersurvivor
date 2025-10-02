# Guía de Despliegue - TraderSurvivor con Sistema de Suscripciones

## 📋 Resumen del Proyecto

TraderSurvivor es una aplicación de trading journal profesional que ahora incluye un sistema completo de suscripciones y pagos. Los usuarios pueden registrarse gratuitamente y actualizar a Premium para acceder a funcionalidades avanzadas.

## 🏗️ Arquitectura del Sistema

### Componentes Principales:
- **Frontend:** HTML/CSS/JavaScript estático desplegado en Vercel
- **Autenticación:** Firebase Authentication
- **Base de Datos:** Firebase Firestore
- **Pagos:** Stripe Checkout + Webhooks
- **Backend:** Funciones Serverless de Vercel

### Flujo de Usuario:
1. **Registro/Login** → `auth.html`
2. **Aplicación Principal** → `index.html`
3. **Página de Precios** → `pricing.html`
4. **Proceso de Pago** → Stripe Checkout
5. **Confirmación** → `success.html` / `cancel.html`

## 🚀 Pasos de Despliegue

### 1. Configurar Stripe

#### Crear Productos y Precios:
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navega a **Productos** → **Crear producto**
3. Crea dos productos:
   - **Pro Mensual:** $19/mes
   - **Pro Anual:** $190/año
4. Anota los **Price IDs** (empiezan con `price_`)

#### Configurar Webhooks:
1. Ve a **Desarrolladores** → **Webhooks**
2. Añade endpoint: `https://tu-dominio.vercel.app/api/stripe-webhook`
3. Selecciona eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Anota el **Webhook Secret**

### 2. Configurar Firebase

#### Habilitar Authentication:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `tradersurvivor99`
3. Ve a **Authentication** → **Sign-in method**
4. Habilita **Email/Password**

#### Configurar Firestore:
1. Ve a **Firestore Database**
2. Actualiza las reglas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /operations/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /accounts/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /finances/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

#### Generar Service Account Key:
1. Ve a **Configuración del proyecto** → **Cuentas de servicio**
2. Haz clic en **Generar nueva clave privada**
3. Descarga el archivo JSON
4. **Importante:** Convierte el JSON a una sola línea sin espacios

### 3. Configurar Variables de Entorno en Vercel

En tu proyecto de Vercel, añade estas variables de entorno:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` o `sk_live_...` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Secreto del webhook de Stripe |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `{"type":"service_account",...}` | JSON de la cuenta de servicio (una línea) |

### 4. Actualizar Configuración del Frontend

#### En `pricing.html` (línea ~165):
```javascript
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY'); // Reemplaza con tu clave publicable
```

#### En `api/create-checkout-session.js`:
- Los Price IDs se pasan dinámicamente desde el frontend
- No necesitas cambiar nada aquí

### 5. Desplegar en Vercel

#### Opción A: Desde GitHub
1. Sube tu código a un repositorio de GitHub
2. Conecta el repositorio con Vercel
3. Vercel detectará automáticamente la configuración

#### Opción B: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

## 🔧 Funcionalidades Implementadas

### Plan Gratuito:
- ✅ Hasta 10 operaciones visibles
- ✅ Dashboard básico
- ✅ 1 cuenta de trading
- ❌ Analytics avanzados (bloqueado)
- ❌ Exportación de datos (deshabilitada)
- ❌ Funciones financieras avanzadas (bloqueadas)

### Plan Premium:
- ✅ Operaciones ilimitadas
- ✅ Dashboard completo
- ✅ Cuentas ilimitadas
- ✅ Analytics avanzados
- ✅ Exportación de datos
- ✅ Gestión financiera completa
- ✅ Badge "Premium" en la interfaz

## 🧪 Pruebas del Sistema

### Flujo de Registro:
1. Ve a `tu-dominio.vercel.app/auth.html`
2. Registra un nuevo usuario
3. Verifica que se redirija a `index.html`
4. Confirma que aparece el botón "Go Premium"

### Flujo de Suscripción:
1. Haz clic en "Go Premium"
2. Selecciona un plan en `pricing.html`
3. Completa el pago en Stripe (usa tarjeta de prueba: `4242 4242 4242 4242`)
4. Verifica redirección a `success.html`
5. Confirma que el botón "Go Premium" desaparece
6. Verifica que aparece el badge "Premium"

### Verificar Restricciones:
1. **Usuario Gratuito:**
   - Analytics debe estar bloqueado con overlay
   - Solo 10 operaciones visibles
   - Botones de exportación deshabilitados
2. **Usuario Premium:**
   - Acceso completo a todas las funciones
   - Sin restricciones de operaciones
   - Funciones de exportación habilitadas

## 🔍 Solución de Problemas

### Error: "Webhook signature verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente
- Asegúrate de que el endpoint del webhook apunte a la URL correcta

### Error: "Firebase Admin SDK not initialized"
- Verifica que `FIREBASE_SERVICE_ACCOUNT_KEY` sea un JSON válido en una sola línea
- Confirma que la cuenta de servicio tenga permisos de Firestore

### Error: "Stripe publishable key not found"
- Actualiza la clave publicable en `pricing.html`
- Verifica que uses la clave correcta (test vs live)

### Usuarios no se actualizan a Premium después del pago
- Verifica que el webhook esté recibiendo eventos
- Revisa los logs de la función `/api/stripe-webhook`
- Confirma que las reglas de Firestore permiten escritura

## 📊 Monitoreo y Analytics

### Métricas Importantes:
- **Conversión:** Usuarios gratuitos → Premium
- **Retención:** Cancelaciones de suscripción
- **Ingresos:** MRR (Monthly Recurring Revenue)

### Herramientas de Monitoreo:
- **Stripe Dashboard:** Métricas de pago y suscripciones
- **Firebase Analytics:** Uso de la aplicación
- **Vercel Analytics:** Rendimiento del sitio web

## 🔐 Seguridad

### Mejores Prácticas Implementadas:
- ✅ Verificación de firmas de webhook
- ✅ Autenticación de usuarios requerida
- ✅ Reglas de seguridad de Firestore
- ✅ Claves secretas en variables de entorno
- ✅ Validación de datos en el backend

### Recomendaciones Adicionales:
- Usar HTTPS en producción (Vercel lo proporciona automáticamente)
- Monitorear logs de errores regularmente
- Implementar rate limiting si es necesario
- Realizar auditorías de seguridad periódicas

## 📞 Soporte

Para problemas técnicos:
1. Revisa los logs de Vercel Functions
2. Verifica la consola de Firebase
3. Consulta el dashboard de Stripe
4. Revisa la consola del navegador para errores de frontend

¡Tu aplicación TraderSurvivor con sistema de suscripciones está lista para generar ingresos! 🚀
