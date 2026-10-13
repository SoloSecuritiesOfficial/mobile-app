# ─────────────────────────────────────────────────────────────────
# React Native / Hermes
# ─────────────────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# ─────────────────────────────────────────────────────────────────
# React Native Reanimated + Worklets
# ─────────────────────────────────────────────────────────────────
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# ─────────────────────────────────────────────────────────────────
# Expo modules
# ─────────────────────────────────────────────────────────────────
-keep class expo.modules.** { *; }
-keep class expo.modules.securestore.** { *; }
-keep class expo.modules.notifications.** { *; }
-keep class expo.modules.font.** { *; }
-keep class expo.modules.imagepicker.** { *; }
-keep class expo.modules.webbrowser.** { *; }

# ─────────────────────────────────────────────────────────────────
# Firebase
# ─────────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ─────────────────────────────────────────────────────────────────
# Google Sign-In
# ─────────────────────────────────────────────────────────────────
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.signin.** { *; }

# ─────────────────────────────────────────────────────────────────
# Google Mobile Ads (AdMob)
# ─────────────────────────────────────────────────────────────────
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# ─────────────────────────────────────────────────────────────────
# React Navigation (screens)
# ─────────────────────────────────────────────────────────────────
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# ─────────────────────────────────────────────────────────────────
# Kotlin (required for kotlin-based native modules)
# ─────────────────────────────────────────────────────────────────
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**

# ─────────────────────────────────────────────────────────────────
# OkHttp / networking (used by Metro bundler and fetch polyfill)
# ─────────────────────────────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# ─────────────────────────────────────────────────────────────────
# AsyncStorage
# ─────────────────────────────────────────────────────────────────
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ─────────────────────────────────────────────────────────────────
# Prevent stripping JS entry point and source map references
# ─────────────────────────────────────────────────────────────────
-keepattributes SourceFile,LineNumberTable
-keep public class com.solosecurities.app.BuildConfig { *; }
