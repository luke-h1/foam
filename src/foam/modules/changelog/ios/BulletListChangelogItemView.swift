//
//  BulletListChangelogItemView.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import Foundation
import SwiftUI

struct BulletListChangelogItemView: View {
  let title: String
  let rows: [ChangelogVersionNoteItem.ListRow]
  let accentColor: Color

  var body: some View {
    VStack(alignment: .leading, spacing: 40) {
      Text(title).font(.title).fontWeight(.bold)

      VStack(alignment: .leading, spacing: 32) {
        ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
          HStack(alignment: .top, spacing: 18) {
            Image(systemName: row.symbolSystemName)
              .symbolRenderingMode(.hierarchical)
              .font(.system(size: 32).weight(.semibold))
              .foregroundStyle(accentColor)
              .frame(width: 48, alignment: .center)

            VStack(alignment: .leading, spacing: 2) {
              Text(row.title)
                .font(.body.weight(.semibold))
                .foregroundStyle(.primary)
              Text(row.description)
                .font(.body)
                .foregroundStyle(.secondary)
            }

          }
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(.horizontal, 40)
    .padding(.top, 64)
    .padding(.bottom, 64)
  }
}
