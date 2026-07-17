//
//  Helpers.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import Foundation

enum Helpers {
  static func getCurrentAppVersion() -> String {
    Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0"
  }

  static func getVersionNotes(for version: String, in notes: [ChangelogVersionNotes])
    -> [ChangelogVersionNoteItem] {
    notes.first(where: { $0.version == version })?.items ?? []
  }
}
