//
//  ChangelogItemImageView.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import SwiftUI

struct ChangelogItemImageView: View {
  let imageUrl: URL

  var body: some View {
    AsyncImage(url: imageUrl) { phase in
      switch phase {
      case .empty:
        ProgressView()
      case let .success(image):
        image
          .resizable()
          .scaledToFill()
      case .failure:
        Image(systemName: "photo.on.rectangle.angled")
          .resizable()
          .scaledToFit()
          .padding(40)
          .foregroundStyle(.secondary)
      @unknown default:
        ProgressView()
      }
    }
  }
}
