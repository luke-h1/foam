//
//  ChangelogItemView.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import SwiftUI

struct ChangelogItemView: View {
  let item: ChangelogVersionNoteItem
  let isCurrent: Bool
  let configuration: ChangelogConfiguration

  private var clipShapeRadius: Double {
    if #available(iOS 26, *) {
      24
    } else {
      12
    }
  }

  var body: some View {
    GeometryReader { proxy in
      let containerWidth = min(max(proxy.size.width, 300), 440)

      VStack(alignment: .leading, spacing: 0) {
        switch item {
        case .media(let mediaKind, let url, let title, let description):
          VStack(alignment: .center, spacing: 12) {
            let mediaPadding = 16.0

            ZStack {
              switch mediaKind {
              case .image:
                ChangelogItemImageView(
                  imageUrl: url
                )
              case .video:
                MediaChangelogItemVideoView(
                  videoURL: url,
                  isPlaying: isCurrent
                )
              }
            }
            .frame(
              width: containerWidth - mediaPadding * 2,
              height: containerWidth - mediaPadding * 2
            )
            .clipShape(.rect(cornerRadius: clipShapeRadius))
            .shadow(color: .black.opacity(0.15), radius: 20, x: 0, y: 0)
            .padding(mediaPadding)

            MediaChangelogItemDetailsView(
              title: title,
              description: description
            )

            Spacer()
          }
        case .list(let title, let rows):
          BulletListChangelogItemView(
            title: title,
            rows: rows,
            accentColor: configuration.accentColor
          )
        }
      }
      .frame(width: proxy.size.width, height: proxy.size.height, alignment: .top)
    }
  }
}
