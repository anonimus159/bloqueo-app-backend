package com.workspace.manager

import android.app.Activity
import android.content.Intent
import android.os.Bundle

class PolicyComplianceActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Manejar intents de aprovisionamiento de Android Enterprise (Android 12+)
        if (intent?.action == "android.app.action.GET_PROVISIONING_MODE") {
            val resultIntent = Intent().apply {
                putExtra("android.app.extra.PROVISIONING_MODE", 1) // 1 = DevicePolicyManager.PROVISIONING_MODE_FULLY_MANAGED_DEVICE
            }
            setResult(RESULT_OK, resultIntent)
            finish()
            return
        }
        if (intent?.action == "android.app.action.ADMIN_POLICY_COMPLIANCE") {
            setResult(RESULT_OK)
            finish()
            return
        }
        
        finish()
    }
}
