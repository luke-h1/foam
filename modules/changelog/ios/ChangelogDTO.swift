//
//  ChangelogDTO.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import Foundation
import SwiftUI
import UIKit

enum ChangelogBridgeError: Error {
  case invalidPayload
}

struct ConfigurationDTO: Decodable {
  let nextButtonLabel: String?
  let doneButtonLabel: String?
  let accentColorHex: String?
}

struct PresentOptionsDTO: Decodable {
  let notes: [ChangelogVersionNotesDTO]
  let version: String?
  let otaVersion: String?
  let configuration: ConfigurationDTO?

  static func decode(from dict: [String: Any]) throws -> PresentOptionsDTO {
    guard JSONSerialization.isValidJSONObject(dict) else {
      throw ChangelogBridgeError.invalidPayload
    }
    let data = try JSONSerialization.data(withJSONObject: dict, options: [])
    return try JSONDecoder().decode(PresentOptionsDTO.self, from: data)
  }
}

struct ChangelogVersionNotesDTO: Decodable {
  let version: String
  let items: [NoteItemDTO]
}

enum NoteItemDTO: Decodable {
  case list(title: String, rows: [ListRowDTO])
  case media(kind: MediaKindDTO, url: URL, title: String, description: String)

  enum ItemKind: String, Decodable {
    case list
    case media
  }

  enum MediaKindDTO: String, Decodable {
    case image
    case video
  }

  struct ListRowDTO: Decodable {
    let symbolSystemName: String
    let title: String
    let description: String
  }

  private enum CodingKeys: String, CodingKey {
    case type
    case title
    case rows
    case mediaKind
    case url
    case description
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let kind = try container.decode(ItemKind.self, forKey: .type)
    switch kind {

    case .list:
      let title = try container.decode(String.self, forKey: .title)
      let rows = try container.decode([ListRowDTO].self, forKey: .rows)
      self = .list(title: title, rows: rows)

    case .media:
      let mediaKind = try container.decode(MediaKindDTO.self, forKey: .mediaKind)
      let url = try container.decode(URL.self, forKey: .url)
      let title = try container.decode(String.self, forKey: .title)
      let description = try container.decode(String.self, forKey: .description)
      self = .media(kind: mediaKind, url: url, title: title, description: description)
    }
  }

  func toModel() -> ChangelogVersionNoteItem {
    switch self {
    case .list(let title, let rows):
      return .list(
        title: title,
        rows: rows.map { row in
          ChangelogVersionNoteItem.ListRow(
            symbolSystemName: row.symbolSystemName,
            title: row.title,
            description: row.description
          )
        }
      )
    case .media(let kind, let url, let title, let description):
      let mediaKind: ChangelogVersionNoteItem.MediaKind =
        kind == .image ? .image : .video
      return .media(
        kind: mediaKind,
        url: url,
        title: title,
        description: description
      )
    }
  }
}

extension ChangelogVersionNotesDTO {
  func toModel() -> ChangelogVersionNotes {
    ChangelogVersionNotes(version: version, items: items.map { $0.toModel() })
  }
}

extension ChangelogConfiguration {
  static func from(_ dto: ConfigurationDTO?) -> ChangelogConfiguration {
    guard let dto = dto else {
      return ChangelogConfiguration()
    }

    let nextLabel = dto.nextButtonLabel ?? "Next"
    let doneLabel = dto.doneButtonLabel ?? "Done"

    let accent: Color
    if let hex = dto.accentColorHex, let ui = UIColor(ChangelogHex: hex) {
      accent = Color(uiColor: ui)
    } else {
      accent = .blue
    }

    return ChangelogConfiguration(
      nextButtonLabel: nextLabel,
      doneButtonLabel: doneLabel,
      accentColor: accent
    )
  }
}

extension UIColor {
  convenience init?(ChangelogHex: String) {
    var string = ChangelogHex.trimmingCharacters(in: .whitespacesAndNewlines)
    guard string.hasPrefix("#") else {
      return nil
    }
    string.removeFirst()
    guard string.count == 6 || string.count == 8 else {
      return nil
    }

    var value: UInt64 = 0
    guard Scanner(string: string).scanHexInt64(&value) else {
      return nil
    }

    let r: CGFloat
    let g: CGFloat
    let b: CGFloat
    let a: CGFloat
    if string.count == 6 {
      r = CGFloat((value & 0xFF0000) >> 16) / 255
      g = CGFloat((value & 0x00FF00) >> 8) / 255
      b = CGFloat(value & 0x0000FF) / 255
      a = 1
    } else {
      a = CGFloat((value & 0xFF00_0000) >> 24) / 255
      r = CGFloat((value & 0x00FF_0000) >> 16) / 255
      g = CGFloat((value & 0x0000_FF00) >> 8) / 255
      b = CGFloat(value & 0x0000_00FF) / 255
    }

    self.init(red: r, green: g, blue: b, alpha: a)
  }
}
