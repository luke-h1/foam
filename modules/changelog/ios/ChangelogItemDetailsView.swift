//
//  ChangelogItemDetailsView.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import Foundation
import SwiftUI

struct MediaChangelogItemDetailsView: View {
  let title: String
  let description: String

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(title)
        .font(.title3.weight(.bold))
      Text(description)
    }
    .multilineTextAlignment(.leading)
    .fixedSize(horizontal: false, vertical: true)
    .padding(.horizontal, 30)
    .padding(.bottom, 30)
    .foregroundStyle(.primary)
  }
}
