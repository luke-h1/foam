//
//  Storage.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import Foundation

public final class ChangelogStorage {
  public static func latestSeenAppVersion() -> String? {
    UserDefaults.standard.string(forKey: CHANGELOG_APP_STORAGE_LATEST_SEEN_APP_VERSION_KEY)
  }

  public static func latestSeenOTAVersion() -> String? {
    UserDefaults.standard.string(forKey: CHANGELOG_APP_STORAGE_LATEST_SEEN_OTA_VERSION_KEY)
  }

  public static func markCurrentVersionAsSeen() {
    UserDefaults.standard.set(
      Helpers.getCurrentAppVersion(),
      forKey: CHANGELOG_APP_STORAGE_LATEST_SEEN_APP_VERSION_KEY
    )
  }

  public static func markOTAVersionAsSeen(_ otaVersion: String) {
    UserDefaults.standard.set(otaVersion, forKey: CHANGELOG_APP_STORAGE_LATEST_SEEN_OTA_VERSION_KEY)
  }

  public static func resetSeenVersion() {
    UserDefaults.standard.removeObject(forKey: CHANGELOG_APP_STORAGE_LATEST_SEEN_APP_VERSION_KEY)
  }

  public static func resetSeenOtaVersion() {
    UserDefaults.standard.removeObject(forKey: CHANGELOG_APP_STORAGE_LATEST_SEEN_OTA_VERSION_KEY)
  }
}
