//
//  ChangelogModule.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import ExpoModulesCore

public class ChangelogModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Changelog")

    Function("getCurrentAppVersion") {
      Helpers.getCurrentAppVersion()
    }

    Function("getLatestSeenAppVersion") {
      ChangelogStorage.latestSeenAppVersion()
    }

    Function("getLatestSeenOTAVersion") {
      ChangelogStorage.latestSeenOTAVersion()
    }

    Function("resetSeenVersions") {
      ChangelogStorage.resetSeenVersion()
      ChangelogStorage.resetSeenOtaVersion()
    }

    AsyncFunction("present") { (options: [String: Any]) in
      let dto = try PresentOptionsDTO.decode(from: options)
      let notes = dto.notes.map { $0.toModel() }
      let selectedVersion = dto.otaVersion ?? dto.version ?? Helpers.getCurrentAppVersion()
      let pages = Helpers.getVersionNotes(for: selectedVersion, in: notes)
      let seenMarker: ChangelogSeenMarker =
        dto.otaVersion.map { .otaVersion($0) } ?? .currentVersion

      try await MainActor.run {
        try ChangelogUIKitPresenter.present(
          pages: pages,
          configuration: ChangelogConfiguration.from(dto.configuration),
          seenMarker: seenMarker,
          onFinished: {}
        )
      }
    }

    View(ChangelogView.self) {
      Events("onLoad")

      Prop("url") { (view: ChangelogView, url: String?) in
        view.url = url
      }

      OnViewDidUpdateProps { view in
        view.loadIfNeeded()
      }
    }
  }
}
