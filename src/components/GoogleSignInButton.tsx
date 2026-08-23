/**
 * GoogleSignInButton.tsx
 *
 * SoloSecurities
 *
 * Google OAuth using Expo Auth Session.
 *
 * Required environment variables:
 *
 * EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
 * EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 * EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
 *
 * Example:
 *
 * EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxx.apps.googleusercontent.com
 * EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxx.apps.googleusercontent.com
 * EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
 */

import React, { useEffect, useState } from "react";

import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import api from "../services/api";

import {
  saveToken,
  saveUser,
} from "../utils/storage";

import {
  registerForPushNotifications,
} from "../utils/pushNotifications";

/*
|--------------------------------------------------------------------------
| Complete pending browser authentication session
|--------------------------------------------------------------------------
|
| Required when using expo-auth-session with Expo WebBrowser.
|
*/

WebBrowser.maybeCompleteAuthSession();

/*
|--------------------------------------------------------------------------
| Google Client IDs
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Do not use the Android client ID as the Web client ID.
|
| Google Cloud/Firebase should have separate OAuth clients:
|
| Android
| iOS
| Web
|
*/

const ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || "";

const IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || "";

const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "";

/*
|--------------------------------------------------------------------------
| Placeholder
|--------------------------------------------------------------------------
|
| expo-auth-session requires a string for the client ID.
| We use a placeholder when configuration is missing so the component
| itself doesn't crash during initialization.
|
*/

const PLACEHOLDER_CLIENT_ID =
  "google-client-id-not-configured";

/*
|--------------------------------------------------------------------------
| Select correct client ID
|--------------------------------------------------------------------------
*/

function getPlatformClientId(): string {
  switch (Platform.OS) {
    case "android":
      return (
        ANDROID_CLIENT_ID ||
        PLACEHOLDER_CLIENT_ID
      );

    case "ios":
      return (
        IOS_CLIENT_ID ||
        PLACEHOLDER_CLIENT_ID
      );

    default:
      return (
        WEB_CLIENT_ID ||
        PLACEHOLDER_CLIENT_ID
      );
  }
}

/*
|--------------------------------------------------------------------------
| Check whether correct client ID exists
|--------------------------------------------------------------------------
*/

function isGoogleConfigured(): boolean {
  switch (Platform.OS) {
    case "android":
      return Boolean(ANDROID_CLIENT_ID);

    case "ios":
      return Boolean(IOS_CLIENT_ID);

    default:
      return Boolean(WEB_CLIENT_ID);
  }
}

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface Props {
  onSuccess: (res: any) => void;
  onError: (err: any) => void;
  label?: string;
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function GoogleSignInButton({
  onSuccess,
  onError,
  label = "Continue with Google",
}: Props) {
  const [busy, setBusy] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Google Auth Request
  |--------------------------------------------------------------------------
  */

  const [
    request,
    response,
    promptAsync,
  ] = Google.useAuthRequest({
    androidClientId:
      getPlatformClientId(),

    iosClientId:
      getPlatformClientId(),

    webClientId:
      getPlatformClientId(),

    scopes: [
      "openid",
      "profile",
      "email",
    ],
  });

  /*
  |--------------------------------------------------------------------------
  | Process Google response
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!response) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Successful Google authentication
    |--------------------------------------------------------------------------
    */

    if (response.type === "success") {
      handleGoogleResponse(
        response.authentication
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | OAuth error
    |--------------------------------------------------------------------------
    */

    if (response.type === "error") {
      setBusy(false);

      const errorMessage =
        response.error?.message ||
        response.params?.error_description ||
        response.params?.error ||
        "Google sign-in failed.";

      onError(
        new Error(errorMessage)
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | User cancelled / dismissed browser
    |--------------------------------------------------------------------------
    */

    if (
      response.type === "cancel" ||
      response.type === "dismiss"
    ) {
      setBusy(false);

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Any other response
    |--------------------------------------------------------------------------
    */

    setBusy(false);
  }, [response]);

  /*
  |--------------------------------------------------------------------------
  | Send Google ID token to backend
  |--------------------------------------------------------------------------
  */

  const handleGoogleResponse = async (
    authentication: any
  ) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Authentication validation
      |--------------------------------------------------------------------------
      */

      if (!authentication) {
        throw new Error(
          "Google authentication response was empty."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Get ID token
      |--------------------------------------------------------------------------
      */

      const idToken =
        authentication.idToken;

      if (!idToken) {
        throw new Error(
          "Google did not return an ID token."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Send ID token to SoloSecurities backend
      |--------------------------------------------------------------------------
      */

      const result =
        await api.post(
          "/auth/google",
          {
            idToken,
          }
        );

      const data =
        result?.data;

      /*
      |--------------------------------------------------------------------------
      | Validate backend response
      |--------------------------------------------------------------------------
      */

      if (!data) {
        throw new Error(
          "The server returned an empty response."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Save authentication token
      |--------------------------------------------------------------------------
      */

      if (data.token) {
        await saveToken(
          data.token
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Save authenticated user
      |--------------------------------------------------------------------------
      */

      if (data.user) {
        await saveUser(
          data.user
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Register push notifications
      |--------------------------------------------------------------------------
      |
      | This should never prevent Google login from succeeding.
      |
      */

      registerForPushNotifications()
        .catch(() => {});

      /*
      |--------------------------------------------------------------------------
      | Notify Login screen
      |--------------------------------------------------------------------------
      */

      onSuccess(data);
    } catch (error: any) {
      /*
      |--------------------------------------------------------------------------
      | Extract backend error
      |--------------------------------------------------------------------------
      */

      const backendMessage =
        error?.response?.data?.message;

      const errorMessage =
        backendMessage ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to complete Google sign-in.";

      onError(
        new Error(errorMessage)
      );
    } finally {
      setBusy(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Start Google authentication
  |--------------------------------------------------------------------------
  */

  const handlePress = async () => {
    /*
    |--------------------------------------------------------------------------
    | Prevent duplicate requests
    |--------------------------------------------------------------------------
    */

    if (busy) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Verify configuration
    |--------------------------------------------------------------------------
    */

    if (!isGoogleConfigured()) {
      Alert.alert(
        "Google Sign-In Not Configured",
        getConfigurationMessage()
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Verify auth request
    |--------------------------------------------------------------------------
    */

    if (!request) {
      Alert.alert(
        "Google Sign-In",
        "Google authentication is still preparing. Please try again."
      );

      return;
    }

    try {
      setBusy(true);

      /*
      |--------------------------------------------------------------------------
      | Start OAuth flow
      |--------------------------------------------------------------------------
      */

      await promptAsync();
    } catch (error: any) {
      setBusy(false);

      onError(
        new Error(
          error?.message ||
            "Unable to start Google sign-in."
        )
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Configuration error message
  |--------------------------------------------------------------------------
  */

  const getConfigurationMessage = () => {
    if (Platform.OS === "android") {
      return (
        "Google Sign-In is not configured for Android.\n\n" +
        "Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID " +
        "to your mobile-app/.env file, then restart Expo."
      );
    }

    if (Platform.OS === "ios") {
      return (
        "Google Sign-In is not configured for iOS.\n\n" +
        "Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID " +
        "to your mobile-app/.env file, then restart Expo."
      );
    }

    return (
      "Google Sign-In is not configured for Web.\n\n" +
      "Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID " +
      "to your mobile-app/.env file, then restart Expo."
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Button state
  |--------------------------------------------------------------------------
  */

  const disabled =
    busy || !request;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled &&
          styles.buttonDisabled,
      ]}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={handlePress}
    >
      {busy ? (
        <ActivityIndicator
          size="small"
          color="#555555"
        />
      ) : (
        <Text
          style={styles.googleLetter}
        >
          G
        </Text>
      )}

      <Text
        style={[
          styles.label,
          disabled &&
            styles.labelDisabled,
        ]}
        numberOfLines={1}
      >
        {busy
          ? "Connecting..."
          : label}
      </Text>
    </TouchableOpacity>
  );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  button: {
    minHeight: 52,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#DADCE0",

    borderRadius: 12,

    paddingHorizontal: 18,

    gap: 12,

    elevation: 2,

    shadowColor: "#000000",

    shadowOpacity: 0.06,

    shadowRadius: 5,

    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  googleLetter: {
    width: 25,

    textAlign: "center",

    fontSize: 21,

    lineHeight: 25,

    fontWeight: "800",

    color: "#4285F4",
  },

  label: {
    color: "#202124",

    fontSize: 15,

    fontWeight: "600",

    letterSpacing: 0.05,
  },

  labelDisabled: {
    color: "#777777",
  },
});