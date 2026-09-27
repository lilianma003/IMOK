import 'dotenv/config';

{
  "expo": {
    "name": "IMOK",
    "slug": "IMOK",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.lilianma003.imok",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "com.lilianma003.imok",
      "googleServicesFile": "./google-services.json",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "FOREGROUND_SERVICE",
        "SCHEDULE_EXACT_ALARM",
        "USE_EXACT_ALARM",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "FOREGROUND_SERVICE",
        "SCHEDULE_EXACT_ALARM",
        "USE_EXACT_ALARM",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "color": "#1565c0",
          "sounds": []
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "IMOK uses your location during an active check-in so your emergency contacts can find you if you don't check in.",
          "locationWhenInUsePermission": "IMOK uses your location to share it with your emergency contacts when you send an SOS alert.",
          "isIosBackgroundLocationEnabled": true
        }
      ]
    ],
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "4e26b615-a632-4a12-8755-4d09e40fafd0"
      },
      "cloudinaryCloudName": "qewtdlmk",
      "cloudinaryUploadPreset": "unsigned_upload",
      "firebaseApiKey": "AIzaSyDiwcwDdezMSAHhT-Bj3zIl0iue4ltDGT8",
      "firebaseAuthDomain": "imok-tentative.firebaseapp.com",
      "firebaseProjectId": "imok-tentative",
      "firebaseStorageBucket": "imok-tentative.firebasestorage.app",
      "firebaseMessagingSenderId": "384147725074",
      "firebaseAppId": "1:384147725074:web:cbf319f4cae02f38f5f1cb"
    },
    "owner": "lilianma003",
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/4e26b615-a632-4a12-8755-4d09e40fafd0"
    }
  }
}

export default {
  expo: {
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      easProjectId: process.env.EAS_PROJECT_ID,
    }
  }
};
