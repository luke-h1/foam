//
//  ChangelogUIKitPresent.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import SwiftUI
import UIKit

enum ChangelogUIKitError: Error {
  case noPresentingWindow
}

enum ChangelogUIKitPresenter {
  @MainActor
  static func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene =
      scenes.first(where: { $0.activationState == .foregroundActive }) ?? scenes.first
    guard let windowScene = scene else {
      return nil
    }

    let window = windowScene.windows.first(where: \.isKeyWindow) ?? windowScene.windows.first
    guard let root = window?.rootViewController else {
      return nil
    }

    return findTop(from: root)
  }

  private static func findTop(from viewController: UIViewController) -> UIViewController {
    if let presented = viewController.presentedViewController {
      return findTop(from: presented)
    }
    if let navigation = viewController as? UINavigationController,
      let visible = navigation.visibleViewController
    {
      return findTop(from: visible)
    }
    if let tab = viewController as? UITabBarController,
      let selected = tab.selectedViewController
    {
      return findTop(from: selected)
    }
    return viewController
  }

  @MainActor
  static func present(
    pages: [ChangelogVersionNoteItem],
    configuration: ChangelogConfiguration,
    seenMarker: ChangelogSeenMarker?,
    onFinished: @escaping () -> Void
  ) throws {
    guard let presenter = topViewController() else {
      throw ChangelogUIKitError.noPresentingWindow
    }

    let completion = ChangelogPresentationCompletion(
      seenMarker: seenMarker,
      onFinished: onFinished
    )
    let content = ChangelogSheetContentView(
      versionNotes: pages,
      configuration: configuration,
      onDone: {
        completion.completeIfNeeded()
      }
    )
    let hosting = ChangelogHostingController(
      rootView: content,
      completion: completion
    )
    hosting.modalPresentationStyle = .pageSheet
    presenter.present(hosting, animated: true)
  }
}

final class ChangelogPresentationCompletion {
  private let seenMarker: ChangelogSeenMarker?
  private let onFinished: () -> Void
  private var didFinish = false

  init(seenMarker: ChangelogSeenMarker?, onFinished: @escaping () -> Void) {
    self.seenMarker = seenMarker
    self.onFinished = onFinished
  }

  func completeIfNeeded() {
    guard !didFinish else {
      return
    }
    didFinish = true
    switch seenMarker {
    case .currentVersion:
      ChangelogStorage.markCurrentVersionAsSeen()
    case .otaVersion(let otaVersion):
      ChangelogStorage.markOTAVersionAsSeen(otaVersion)
    case nil:
      break
    }
    onFinished()
  }
}

final class ChangelogHostingController: UIHostingController<ChangelogSheetContentView>,
  UIAdaptivePresentationControllerDelegate
{
  private let completion: ChangelogPresentationCompletion

  init(
    rootView: ChangelogSheetContentView,
    completion: ChangelogPresentationCompletion
  ) {
    self.completion = completion
    super.init(rootView: rootView)
  }

  @MainActor required dynamic init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    presentationController?.delegate = self
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    completion.completeIfNeeded()
  }
}
