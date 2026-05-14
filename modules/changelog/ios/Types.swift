//
//  Types.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import Foundation
import SwiftUI

public enum ChangelogVersionNoteItem: Sendable, Codable {
  case media(
    kind: MediaKind, url: URL, title: String, description: String)
  case list(title: String, rows: [ListRow])

  public enum MediaKind: Sendable, Codable {
    case image
    case video
  }

  public struct ListRow: Sendable, Codable {
    public init(
      symbolSystemName: String, title: String, description: String
    ) {
      self.symbolSystemName = symbolSystemName
      self.title = title
      self.description = description
    }

    let symbolSystemName: String
    let title: String
    let description: String
  }
}

public struct ChangelogVersionNotes: Sendable, Codable {
  public init(version: String, items: [ChangelogVersionNoteItem]) {
    self.version = version
    self.items = items
  }

  let version: String
  let items: [ChangelogVersionNoteItem]
}

public enum ChangelogSeenMarker: Sendable, Hashable {
  case currentVersion
  case otaVersion(String)
}

public struct ChangelogConfiguration {
  let nextButtonLabel: String
  let doneButtonLabel: String
  let accentColor: Color

  public init(
    nextButtonLabel: String = "Next",
    doneButtonLabel: String = "Done",
    accentColor: Color = .blue
  ) {
    self.nextButtonLabel = nextButtonLabel
    self.doneButtonLabel = doneButtonLabel
    self.accentColor = accentColor
  }
}
