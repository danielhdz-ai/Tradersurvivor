# Diseño de Arquitectura para el Sistema de Pagos y Acceso de TraderSurvivor

## 1. Introducción

Este documento detalla la arquitectura propuesta para integrar un sistema de pagos y gestión de suscripciones en la plataforma TraderSurvivor. El objetivo es permitir a los usuarios comprar acceso a funcionalidades premium mediante un modelo de suscripción, utilizando Stripe como pasarela de pago y Firebase para la autenticación y el almacenamiento de datos de suscripción.

## 2. Componentes Clave

La arquitectura se basará en los siguientes componentes principales:

*   **Frontend (Aplicación TraderSurvivor):** La interfaz de usuario existente (`index.html`, `auth.html`, `firebase-integration.js`) que interactuará con el sistema de pagos y verificará el estado de la suscripción.
*   **Stripe:** La pasarela de pago que gestionará las transacciones, los planes de suscripción y la facturación recurrente.
*   **Funciones Serverless (Vercel Functions o Firebase Cloud Functions):** Un pequeño backend sin servidor que manejará las interacciones seguras con la API de Stripe (creación de sesiones de checkout, gestión de webhooks) y actualizará el estado de la suscripción en Firestore.
*   **Firebase Firestore:** La base de datos NoSQL que almacenará la información de la suscripción de cada usuario, vinculada a su UID de autenticación.
*   **Firebase Authentication:** Ya implementado, gestionará el registro y el inicio de sesión de los usuarios.

## 3. Flujo de Usuario y Lógica de Suscripción

El proceso de suscripción y verificación de acceso seguirá los siguientes pasos:

### 3.1. Flujo de Compra de Suscripción

1.  **Usuario no suscrito:** Un usuario autenticado (o un nuevo usuario) intenta acceder a una funcionalidad premium o visita una página de precios.
2.  **Página de Precios/Suscripción:** El frontend muestra los planes de suscripción disponibles (ej. mensual, anual) y un botón para "Suscribirse".
3.  **Inicio de Checkout:** Cuando el usuario selecciona un plan y hace clic en "Suscribirse", el frontend realiza una llamada a una Función Serverless (ej. `/api/create-checkout-session`).
4.  **Creación de Sesión de Checkout (Serverless Function):**
    *   La Función Serverless recibe el ID del plan seleccionado y el UID del usuario (del token de autenticación de Firebase).
    *   Utiliza la API de Stripe para crear una nueva sesión de Stripe Checkout, especificando el plan, la URL de éxito y la URL de cancelación.
    *   Devuelve el ID de la sesión de Checkout al frontend.
5.  **Redirección a Stripe Checkout:** El frontend redirige al usuario a la URL de Stripe Checkout, donde el usuario introduce sus datos de pago de forma segura.
6.  **Pago Exitoso/Fallido:**
    *   Si el pago es exitoso, Stripe redirige al usuario a la URL de éxito configurada (ej. `/success`).
    *   Si el pago falla o se cancela, Stripe redirige al usuario a la URL de cancelación (ej. `/cancel`).

### 3.2. Manejo de Eventos de Stripe (Webhooks)

1.  **Webhook de Stripe:** Stripe envía eventos (webhooks) a una Función Serverless designada (ej. `/api/stripe-webhook`) cuando ocurren eventos importantes (ej. `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_succeeded`, `invoice.payment_failed`).
2.  **Procesamiento del Webhook (Serverless Function):**
    *   La Función Serverless verifica la firma del webhook para asegurar su autenticidad.
    *   Para el evento `checkout.session.completed`:
        *   Extrae el `customer_id` y `subscription_id` de Stripe.
        *   Actualiza el documento del usuario en Firestore (colección `users`) con el estado de la suscripción (ej. `isPremium: true`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionEndDate`).
    *   Para otros eventos (ej. `invoice.payment_failed`, `customer.subscription.deleted`):
        *   Actualiza el estado de la suscripción del usuario en Firestore a `isPremium: false` o ajusta la fecha de vencimiento.

### 3.3. Verificación de Acceso en el Frontend

1.  **Carga de Datos de Usuario:** Al iniciar sesión, el frontend consulta Firestore para obtener el documento del usuario y verificar su estado de suscripción (`isPremium`).
2.  **Restricción de Funcionalidades:**
    *   Si `isPremium` es `true`, el usuario tiene acceso completo a todas las funcionalidades.
    *   Si `isPremium` es `false` (o la suscripción ha caducado), se restringe el acceso a las funcionalidades premium y se le anima a suscribirse.

## 4. Estructura de Datos en Firestore

Se propone añadir los siguientes campos al documento de cada usuario en la colección `users` de Firestore:

| Campo                  | Tipo      | Descripción                                                                 |
| :--------------------- | :-------- | :-------------------------------------------------------------------------- |
| `isPremium`            | `boolean` | `true` si el usuario tiene una suscripción activa, `false` en caso contrario. |
| `stripeCustomerId`     | `string`  | ID del cliente en Stripe, para futuras gestiones de suscripción.            |
| `stripeSubscriptionId` | `string`  | ID de la suscripción activa en Stripe.                                      |
| `subscriptionPlan`     | `string`  | Nombre o ID del plan de suscripción (ej. "Pro Mensual").                  |
| `subscriptionEndDate`  | `timestamp` | Fecha de finalización de la suscripción actual.                            |

## 5. Consideraciones de Seguridad

*   **Claves de API de Stripe:** Las claves secretas de Stripe **nunca** deben exponerse en el frontend. Siempre deben usarse en las Funciones Serverless.
*   **Verificación de Webhooks:** Es crucial verificar la firma de los webhooks de Stripe para asegurar que provienen de Stripe y no de una fuente maliciosa.
*   **Reglas de Seguridad de Firestore:** Las reglas de Firestore deben configurarse para permitir que solo el usuario autenticado pueda leer y escribir en su propio documento de usuario, y que las Funciones Serverless puedan actualizar los campos de suscripción.

## 6. Próximos Pasos

1.  **Configurar planes de productos en Stripe.**
2.  **Implementar las Funciones Serverless** para la creación de sesiones de checkout y el manejo de webhooks.
3.  **Integrar el botón de suscripción** en el frontend y la lógica de redirección.
4.  **Implementar la lógica de verificación de suscripción** en el frontend para restringir el acceso a funcionalidades premium.
5.  **Actualizar las reglas de seguridad de Firestore** para gestionar el acceso a los datos de suscripción.

Este diseño proporciona una base sólida para un sistema de suscripciones escalable y seguro para TraderSurvivor.
