//
//  MediaChangelogItemVideoView.swift
//  Pods
//
//  Created by luke howsam on 14/05/2026.
//

import AVKit
import SwiftUI
import UIKit

struct MediaChangelogItemVideoView: View {
  let videoURL: URL
  let isPlaying: Bool

  @State private var player: AVQueuePlayer?
  @State private var playerLooper: AVPlayerLooper?
  @State private var videoStatusObserver: NSKeyValueObservation?
  @State private var isVideoLoading: Bool = true

  var body: some View {
    ZStack {
      AspectFillVideoPlayer(player: player)
        .opacity(isVideoLoading ? 0 : 1)

      if isVideoLoading {
        ProgressView()
      }
    }
    .task(id: videoURL) {
      await prepareVideo()
    }
    .onChange(of: isPlaying) { _ in
      updatePlaybackState()
    }
    .onDisappear {
      videoStatusObserver?.invalidate()
      videoStatusObserver = nil
      player?.pause()
    }
  }

  private func prepareVideo() async {
    videoStatusObserver?.invalidate()
    videoStatusObserver = nil

    isVideoLoading = true

    let asset = AVURLAsset(url: videoURL)
    let playerItem = AVPlayerItem(asset: asset)

    playerItem.preferredForwardBufferDuration = 2.0

    let queuePlayer = AVQueuePlayer(playerItem: playerItem)
    queuePlayer.automaticallyWaitsToMinimizeStalling = true

    videoStatusObserver = queuePlayer.observe(\.currentItem?.status, options: [.initial, .new]) {
      observedPlayer, _ in
      Task { @MainActor in
        switch observedPlayer.currentItem?.status {
        case .readyToPlay, .failed:
          isVideoLoading = false
        default:
          break
        }
      }
    }

    player = queuePlayer
    playerLooper = AVPlayerLooper(player: queuePlayer, templateItem: playerItem)

    updatePlaybackState()
  }

  private func updatePlaybackState() {
    if isPlaying {
      player?.play()
    } else {
      player?.pause()
    }
  }
}

private struct AspectFillVideoPlayer: UIViewRepresentable {
  final class PlayerView: UIView {
    override static var layerClass: AnyClass {
      AVPlayerLayer.self
    }

    var playerLayer: AVPlayerLayer {
      layer as! AVPlayerLayer
    }
  }

  let player: AVPlayer?

  func makeUIView(context _: Context) -> PlayerView {
    let view = PlayerView()
    view.playerLayer.videoGravity = .resizeAspectFill
    view.clipsToBounds = true
    return view
  }

  func updateUIView(_ uiView: PlayerView, context _: Context) {
    uiView.playerLayer.player = player
  }
}
