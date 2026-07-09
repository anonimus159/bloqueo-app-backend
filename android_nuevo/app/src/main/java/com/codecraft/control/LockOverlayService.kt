package com.codecraft.control

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.content.res.ColorStateList
import android.widget.EditText
import android.widget.TextClock
import android.text.InputType
import android.text.InputFilter
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.Date
import android.util.Log
import android.animation.ObjectAnimator
import android.view.animation.DecelerateInterpolator

class LockOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var scrollContainer: ScrollView? = null

    override fun onBind(intent: Intent?): IBinder? {
        return null // Not binding to anything
    }

    private fun generateDailyBypassCode(serial: String, dateStr: String): String {
        try {
            val input = serial + "CodeCraftBypass2026" + dateStr
            val bytes = MessageDigest.getInstance("MD5").digest(input.toByteArray())
            var value = 0
            for (i in 0..3) {
                value = (value shl 8) or (bytes[i].toInt() and 0xFF)
            }
            val code = Math.abs(value) % 1000000
            return String.format("%06d", code)
        } catch (e: Exception) {
            return "000000"
        }
    }

    private fun validateBypassCode(enteredCode: String): Boolean {
        val deviceSerialNumber = android.provider.Settings.Secure.getString(contentResolver, android.provider.Settings.Secure.ANDROID_ID) ?: "UNKNOWN_DEVICE"
        val sdf = SimpleDateFormat("yyyyMMdd", Locale.US)
        val now = System.currentTimeMillis()
        
        val todayStr = sdf.format(Date(now))
        val yesterdayStr = sdf.format(Date(now - 24 * 60 * 60 * 1000L))
        val tomorrowStr = sdf.format(Date(now + 24 * 60 * 60 * 1000L))
        
        val codeToday = generateDailyBypassCode(deviceSerialNumber, todayStr)
        val codeYesterday = generateDailyBypassCode(deviceSerialNumber, yesterdayStr)
        val codeTomorrow = generateDailyBypassCode(deviceSerialNumber, tomorrowStr)
        
        Log.d("BypassCodeOverlay", "Validando: $enteredCode contra Hoy=$codeToday, Ayer=$codeYesterday, Mañana=$codeTomorrow")
        
        return enteredCode == codeToday || enteredCode == codeYesterday || enteredCode == codeTomorrow
    }

    private fun shakeView(view: View) {
        val animatorX = ObjectAnimator.ofFloat(
            view, "translationX",
            0f, 25f, -25f, 25f, -25f, 15f, -15f, 6f, -6f, 0f
        )
        animatorX.duration = 500
        animatorX.interpolator = DecelerateInterpolator()
        animatorX.start()
    }

    override fun onCreate() {
        super.onCreate()
        
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        // Helper functions for premium UI shapes and ripples
        fun createRoundedDrawable(backgroundColor: Int, cornerRadiusDp: Float, strokeColor: Int = Color.TRANSPARENT, strokeWidthDp: Int = 0): GradientDrawable {
            return GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                setColor(backgroundColor)
                cornerRadius = cornerRadiusDp * resources.displayMetrics.density
                if (strokeWidthDp > 0) {
                    setStroke((strokeWidthDp * resources.displayMetrics.density).toInt(), strokeColor)
                }
            }
        }

        fun createRippleDrawable(normalColor: Int, pressedColor: Int, cornerRadiusDp: Float, strokeColor: Int = Color.TRANSPARENT, strokeWidthDp: Int = 0): RippleDrawable {
            val content = createRoundedDrawable(normalColor, cornerRadiusDp, strokeColor, strokeWidthDp)
            val mask = createRoundedDrawable(Color.WHITE, cornerRadiusDp)
            return RippleDrawable(
                ColorStateList.valueOf(pressedColor),
                content,
                mask
            )
        }

        // Scale feedback on press
        fun setupPressScaleAnimation(view: View) {
            view.setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        v.animate().scaleX(0.97f).scaleY(0.97f).setDuration(80).start()
                    }
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        v.animate().scaleX(1.0f).scaleY(1.0f).setDuration(80).start()
                    }
                }
                false
            }
        }

        // Content layout
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setBackgroundColor(Color.parseColor("#090D16")) // Very dark blue space background
            setPadding(40, 140, 40, 60) // Generous top padding for status bar/notch
        }

        // 1. TextClock Time
        val textClockTime = TextClock(this).apply {
            format12Hour = "hh:mm a"
            format24Hour = "HH:mm"
            textSize = 50f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = Typeface.create("sans-serif-thin", Typeface.NORMAL)
        }
        rootLayout.addView(textClockTime)

        // 2. TextClock Date
        val textClockDate = TextClock(this).apply {
            format12Hour = "EEEE, dd 'de' MMMM"
            format24Hour = "EEEE, dd 'de' MMMM"
            textSize = 14f
            setTextColor(Color.parseColor("#9CA3AF"))
            gravity = Gravity.CENTER
            setPadding(0, 5, 0, 40)
        }
        rootLayout.addView(textClockDate)

        // 3. Bento card overlay container
        val cardLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = createRoundedDrawable(
                Color.parseColor("#111827"), // Dark Surface
                24f,
                Color.parseColor("#374151"), // Border
                1
            )
            setPadding(40, 40, 40, 40)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            lp.bottomMargin = 30
            layoutParams = lp
        }

        // Warning Icon
        val iconView = TextView(this).apply {
            text = "⚠"
            textSize = 28f
            setTextColor(Color.parseColor("#EF4444")) // Red accent
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 10)
        }
        cardLayout.addView(iconView)

        val titleView = TextView(this).apply {
            text = "DISPOSITIVO SUSPENDIDO"
            textSize = 16f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#EF4444"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 12)
        }
        cardLayout.addView(titleView)

        val messageView = TextView(this).apply {
            text = "Este equipo ha sido bloqueado temporalmente por administración. Comuníquese con su proveedor o realice su pago."
            textSize = 13f
            setTextColor(Color.parseColor("#D1D5DB"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
            setLineSpacing(0f, 1.2f)
        }
        cardLayout.addView(messageView)

        // Offline Passcode Label
        val txtOfflineLabel = TextView(this).apply {
            text = "CÓDIGO DE DESBLOQUEO OFFLINE"
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#9CA3AF"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 10)
        }
        cardLayout.addView(txtOfflineLabel)

        // Offline Passcode Input
        val edtBypassCode = EditText(this).apply {
            hint = "------"
            textSize = 20f
            setTextColor(Color.WHITE)
            setHintTextColor(Color.parseColor("#4B5563"))
            gravity = Gravity.CENTER
            inputType = InputType.TYPE_CLASS_NUMBER
            filters = arrayOf(InputFilter.LengthFilter(6))
            typeface = Typeface.MONOSPACE
            background = createRoundedDrawable(Color.parseColor("#1F2937"), 12f, Color.parseColor("#374151"), 1)
            setPadding(20, 20, 20, 20)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            lp.bottomMargin = 20
            layoutParams = lp
        }

        // Input Focus Glowing Animation
        edtBypassCode.onFocusChangeListener = View.OnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                edtBypassCode.background = createRoundedDrawable(
                    Color.parseColor("#1F2937"),
                    12f,
                    Color.parseColor("#8B5CF6"), // Accent Purple Glowing border
                    1
                )
            } else {
                edtBypassCode.background = createRoundedDrawable(
                    Color.parseColor("#1F2937"),
                    12f,
                    Color.parseColor("#374151"),
                    1
                )
            }
        }
        cardLayout.addView(edtBypassCode)

        // Primary Unlock Button
        val btnUnlockOffline = Button(this).apply {
            text = "DESBLOQUEAR EQUIPO"
            textSize = 14f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.WHITE)
            background = createRippleDrawable(
                Color.parseColor("#10B981"), // Emerald Green
                Color.parseColor("#059669"),
                12f
            )
            setPadding(30, 20, 30, 20)
            setupPressScaleAnimation(this)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            lp.bottomMargin = 25
            layoutParams = lp

            setOnClickListener {
                val code = edtBypassCode.text.toString().trim()
                if (code.length < 6) {
                    Toast.makeText(this@LockOverlayService, "Ingrese el código de 6 dígitos.", Toast.LENGTH_SHORT).show()
                    shakeView(cardLayout)
                } else {
                    if (validateBypassCode(code)) {
                        try {
                            val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
                            prefs.edit().putBoolean("is_locked", false).apply()
                            
                            // Remover políticas restrictivas
                            OfflineLockManager.applyEnterpriseLockPolicies(this@LockOverlayService, false)
                            
                            Toast.makeText(this@LockOverlayService, "Equipo liberado con éxito.", Toast.LENGTH_LONG).show()
                            
                            // Detener servicio
                            stopSelf()
                        } catch (e: Exception) {
                            Toast.makeText(this@LockOverlayService, "Error al desbloquear: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        Toast.makeText(this@LockOverlayService, "Código incorrecto.", Toast.LENGTH_LONG).show()
                        shakeView(cardLayout)
                    }
                }
            }
        }
        cardLayout.addView(btnUnlockOffline)

        rootLayout.addView(cardLayout)

        // Bottom action button row (Side-by-side layout)
        val buttonRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            layoutParams = lp
        }

        val btnEmergency = Button(this).apply {
            text = "EMERGENCIA"
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#EF4444"))
            background = createRippleDrawable(
                Color.TRANSPARENT,
                Color.parseColor("#1F1C1C"),
                12f,
                Color.parseColor("#EF4444"),
                1
            )
            setPadding(20, 20, 20, 20)
            setupPressScaleAnimation(this)
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f).apply {
                rightMargin = 15
            }
            layoutParams = lp
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
        buttonRow.addView(btnEmergency)

        val btnHowToPay = Button(this).apply {
            text = "CÓMO PAGAR"
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.WHITE)
            background = createRippleDrawable(
                Color.parseColor("#2563EB"),
                Color.parseColor("#1D4ED8"),
                12f
            )
            setPadding(20, 20, 20, 20)
            setupPressScaleAnimation(this)
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f)
            layoutParams = lp
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
        buttonRow.addView(btnHowToPay)
        rootLayout.addView(buttonRow)

        // ScrollView wrapper to fit screen sizes
        scrollContainer = ScrollView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#090D16"))
            isFillViewport = true
            isVerticalScrollBarEnabled = false
        }
        scrollContainer?.addView(rootLayout)

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
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        )

        // Add the view to the window manager
        try {
            windowManager.addView(scrollContainer, params)
        } catch (e: Exception) {
            Toast.makeText(this, "Error al mostrar overlay: ${e.message}", Toast.LENGTH_LONG).show()
            stopSelf()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        
        val prefs = getSharedPreferences("CodeCraftPrefs", MODE_PRIVATE)
        val isLocked = prefs.getBoolean("is_locked", false)
        
        if (isLocked) {
            val restartServiceIntent = Intent(applicationContext, this.javaClass)
            restartServiceIntent.setPackage(packageName)
            startService(restartServiceIntent)
            
            val restartActivityIntent = Intent(applicationContext, LockScreenActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            startActivity(restartActivityIntent)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (scrollContainer != null) {
            windowManager.removeView(scrollContainer)
            scrollContainer = null
        }
    }
}
