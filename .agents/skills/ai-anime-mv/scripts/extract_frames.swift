import Foundation
import AVFoundation
import AppKit
let input = CommandLine.arguments[1]
let out = CommandLine.arguments[2]
let asset = AVURLAsset(url: URL(fileURLWithPath: input))
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
gen.maximumSize = CGSize(width: 1280, height: 720)
let times = CommandLine.arguments.dropFirst(3).compactMap { Double($0) }
for s in times {
  do {
    let cg = try gen.copyCGImage(at: CMTime(seconds: s, preferredTimescale: 600), actualTime: nil)
    let rep = NSBitmapImageRep(cgImage: cg)
    let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.88])!
    let name = String(format: "frame_%07.2f.jpg", s)
    try data.write(to: URL(fileURLWithPath: out).appendingPathComponent(name))
    print(name)
  } catch { print("ERROR \(s): \(error)") }
}
