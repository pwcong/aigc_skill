#!/usr/bin/env swift
import Foundation
import AVFoundation
import AppKit
import CoreImage

// Read decoded samples, not rounded frame/fps seek requests. All frame indices are 0-based.
struct MediaError: Error, CustomStringConvertible { let description: String }
func fail(_ message: String) throws -> Never { throw MediaError(description: message) }
func seconds(_ time: CMTime) -> Double { CMTimeGetSeconds(time) }
func validDuration(_ time: CMTime) -> Bool { time.isNumeric && seconds(time).isFinite && seconds(time) > 0 }
func rational(_ time: CMTime) -> [String: Any] {
    ["seconds": seconds(time), "value": time.value, "timescale": time.timescale]
}
func emit(_ object: Any) throws {
    let data = try JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted, .sortedKeys])
    print(String(decoding: data, as: UTF8.self))
}
struct Frame {
    let pts: CMTime
    let sampleDuration: CMTime
}
struct Media {
    let url: URL
    let asset: AVURLAsset
    let track: AVAssetTrack
    init(_ path: String) throws {
        url = URL(fileURLWithPath: path).standardizedFileURL
        guard FileManager.default.fileExists(atPath: url.path) else { try fail("Input does not exist: \(url.path)") }
        asset = AVURLAsset(url: url)
        guard let video = asset.tracks(withMediaType: .video).first else { try fail("No video track") }
        track = video
    }
    func scan(onFrame: ((Int, CMSampleBuffer) throws -> Void)? = nil) throws -> [Frame] {
        let reader = try AVAssetReader(asset: asset)
        let output = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
        output.alwaysCopiesSampleData = false
        guard reader.canAdd(output) else { try fail("Cannot attach video decoder") }
        reader.add(output)
        guard reader.startReading() else { try fail("Cannot start decoding: \(reader.error?.localizedDescription ?? "unknown")") }
        var frames: [Frame] = []
        while let sample = output.copyNextSampleBuffer() {
            let pts = CMSampleBufferGetPresentationTimeStamp(sample)
            guard pts.isNumeric, seconds(pts).isFinite else { try fail("Invalid presentation timestamp") }
            if let previous = frames.last, CMTimeCompare(pts, previous.pts) <= 0 {
                try fail("Non-increasing decoded presentation timestamps; inspect this source manually")
            }
            try autoreleasepool { try onFrame?(frames.count, sample) }
            frames.append(Frame(pts: pts, sampleDuration: CMSampleBufferGetDuration(sample)))
        }
        guard reader.status == .completed else { try fail("Decoding failed: \(reader.error?.localizedDescription ?? "unknown")") }
        guard !frames.isEmpty else { try fail("Video contains no decoded frames") }
        return frames
    }
    func endTime(_ frames: [Frame]) throws -> CMTime {
        let last = frames.last!
        if validDuration(last.sampleDuration) { return CMTimeAdd(last.pts, last.sampleDuration) }
        let trackEnd = CMTimeRangeGetEnd(track.timeRange)
        guard CMTimeCompare(trackEnd, last.pts) > 0 else { try fail("Cannot determine last frame end time") }
        return trackEnd
    }
    func metadata(_ frames: [Frame]) throws -> [String: Any] {
        let end = try endTime(frames)
        let size = track.naturalSize
        let displayed = CGRect(origin: .zero, size: size).applying(track.preferredTransform).standardized
        let t = track.preferredTransform
        let intervals = zip(frames, frames.dropFirst()).map { seconds(CMTimeSubtract($1.pts, $0.pts)) }
        let minInterval = intervals.min() ?? seconds(CMTimeSubtract(end, frames[0].pts))
        let maxInterval = intervals.max() ?? minInterval
        return [
            "path": url.path, "codedWidth": size.width, "codedHeight": size.height,
            "displayWidth": displayed.width, "displayHeight": displayed.height,
            "preferredTransform": ["a": t.a, "b": t.b, "c": t.c, "d": t.d, "tx": t.tx, "ty": t.ty],
            "nominalFPS": track.nominalFrameRate, "frameCount": frames.count,
            "videoTrackCount": asset.tracks(withMediaType: .video).count,
            "videoEndBasis": validDuration(frames.last!.sampleDuration) ? "lastSampleDuration" : "videoTrackTimeRange",
            "videoStart": rational(frames[0].pts), "videoEndExclusive": rational(end),
            "videoDurationSeconds": seconds(CMTimeSubtract(end, frames[0].pts)),
            "assetDurationSeconds": seconds(asset.duration),
            "minFrameIntervalSeconds": minInterval, "maxFrameIntervalSeconds": maxInterval,
            "variableFrameTiming": maxInterval - minInterval > 0.00001,
            "audioTracks": asset.tracks(withMediaType: .audio).map { ["startSeconds": seconds($0.timeRange.start), "durationSeconds": seconds($0.timeRange.duration)] }
        ]
    }
}
func saveJPEG(_ sample: CMSampleBuffer, track: AVAssetTrack, to outputURL: URL) throws {
    guard let pixel = CMSampleBufferGetImageBuffer(sample) else { try fail("Decoded sample has no image") }
    var image = CIImage(cvImageBuffer: pixel)
    // Track transforms use top-left video coordinates; Core Image uses bottom-left coordinates.
    let rect = CGRect(origin: .zero, size: track.naturalSize).applying(track.preferredTransform).standardized
    let toVideo = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: 0, ty: image.extent.height)
    let toImage = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: -rect.minX, ty: rect.maxY)
    image = image.transformed(by: toVideo.concatenating(track.preferredTransform).concatenating(toImage))
    guard let cg = CIContext(options: [.cacheIntermediates: false]).createCGImage(image, from: image.extent) else { try fail("Cannot render image") }
    let bitmap = NSBitmapImageRep(cgImage: cg)
    guard let data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.92]) else { try fail("Cannot encode JPEG") }
    try data.write(to: outputURL, options: .withoutOverwriting)
}
func exportCut(_ media: Media, outputURL: URL, start: CMTime, end: CMTime) throws {
    guard !FileManager.default.fileExists(atPath: outputURL.path) else { try fail("Refusing to overwrite: \(outputURL.path)") }
    guard media.asset.tracks(withMediaType: .video).count == 1 else { try fail("Cut supports one video track; select a main track before using this helper") }
    try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
    guard let exporter = AVAssetExportSession(asset: media.asset, presetName: AVAssetExportPresetHighestQuality), exporter.supportedFileTypes.contains(.mp4) else { try fail("Source cannot be exported as MP4") }
    exporter.outputURL = outputURL
    exporter.outputFileType = .mp4
    exporter.timeRange = CMTimeRange(start: start, end: end)
    exporter.shouldOptimizeForNetworkUse = true
    let done = DispatchSemaphore(value: 0)
    exporter.exportAsynchronously { done.signal() }
    done.wait()
    guard exporter.status == .completed else { try fail("Export failed: \(exporter.error?.localizedDescription ?? "unknown")") }
}
func run() throws {
    let args = CommandLine.arguments
    guard args.count >= 3 else { try fail("Usage: swift media.swift probe SOURCE | timeline SOURCE | frames SOURCE OUT_DIR 0,1,2 | cut SOURCE OUT.mp4 START_FRAME END_FRAME_EXCLUSIVE") }
    let command = args[1]
    guard ["probe", "timeline", "frames", "cut"].contains(command) else { try fail("Unknown command: \(command)") }
    let media = try Media(args[2])
    if command == "frames" {
        guard args.count == 5 else { try fail("frames requires SOURCE OUT_DIR comma-separated indices") }
        let values = args[4].split(separator: ",", omittingEmptySubsequences: false)
        let parsed = values.compactMap { Int($0) }
        guard parsed.count == values.count, !parsed.isEmpty, parsed.allSatisfy({ $0 >= 0 }) else { try fail("Frame indices must be nonnegative integers") }
        let selected = Set(parsed)
        let directory = URL(fileURLWithPath: args[3], isDirectory: true).standardizedFileURL
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        for index in selected where FileManager.default.fileExists(atPath: directory.appendingPathComponent(String(format: "frame_%06d.jpg", index)).path) {
            try fail("Refusing to overwrite image for frame \(index)")
        }
        var results: [[String: Any]] = []
        let frames = try media.scan { index, sample in
            if selected.contains(index) {
                let output = directory.appendingPathComponent(String(format: "frame_%06d.jpg", index))
                try saveJPEG(sample, track: media.track, to: output)
                results.append(["index": index, "pts": rational(CMSampleBufferGetPresentationTimeStamp(sample)), "path": output.path])
            }
        }
        guard selected.allSatisfy({ $0 < frames.count }) else { try fail("Requested index exceeds frameCount \(frames.count); valid requested frames may already have been written") }
        try emit(["source": media.url.path, "frameCount": frames.count, "frames": results])
    } else {
        let frames = try media.scan()
        if command == "probe" {
            guard args.count == 3 else { try fail("probe requires SOURCE") }
            try emit(media.metadata(frames))
        } else if command == "timeline" {
            guard args.count == 3 else { try fail("timeline requires SOURCE") }
            let end = try media.endTime(frames)
            let entries: [[String: Any]] = frames.enumerated().map { index, frame in
                let next = index + 1 < frames.count ? frames[index + 1].pts : end
                return ["index": index, "pts": rational(frame.pts), "endExclusive": rational(next), "durationSeconds": seconds(CMTimeSubtract(next, frame.pts))]
            }
            try emit(["media": try media.metadata(frames), "frames": entries])
        } else {
            guard args.count == 6, let first = Int(args[4]), let limit = Int(args[5]), first >= 0, first < limit, limit <= frames.count else { try fail("cut requires SOURCE OUT.mp4 START_FRAME END_FRAME_EXCLUSIVE, with 0 <= start < end <= frameCount") }
            let start = frames[first].pts
            let end = limit == frames.count ? try media.endTime(frames) : frames[limit].pts
            let output = URL(fileURLWithPath: args[3]).standardizedFileURL
            try exportCut(media, outputURL: output, start: start, end: end)
            let result = try Media(output.path)
            let outputFrames = try result.scan()
            let outputEnd = try result.endTime(outputFrames)
            let requestedDuration = seconds(CMTimeSubtract(end, start))
            let actualDuration = seconds(CMTimeSubtract(outputEnd, outputFrames[0].pts))
            let frameCountMatches = outputFrames.count == limit - first
            let durationMatches = abs(actualDuration - requestedDuration) <= 0.0001
            let timingErrors = zip(frames[first..<limit], outputFrames).map { source, rendered in
                abs(seconds(CMTimeSubtract(source.pts, start)) - seconds(CMTimeSubtract(rendered.pts, outputFrames[0].pts)))
            }
            let maxTimingError = timingErrors.max() ?? Double.infinity
            let frameTimingMatches = frameCountMatches && maxTimingError <= 0.0001
            try emit([
                "source": media.url.path, "sourceStartFrame": first, "sourceEndFrameExclusive": limit,
                "sourceStart": rational(start), "sourceEndExclusive": rational(end),
                "expectedFrameCount": limit - first, "expectedDurationSeconds": requestedDuration,
                "frameCountMatches": frameCountMatches, "durationMatches": durationMatches,
                "frameTimingMatches": frameTimingMatches, "maxFrameTimingErrorSeconds": maxTimingError,
                "timingToleranceSeconds": 0.0001,
                "verified": frameCountMatches && durationMatches && frameTimingMatches, "output": try result.metadata(outputFrames)
            ])
            if !frameCountMatches || !durationMatches || !frameTimingMatches { try fail("Export requires review: frame count, duration or frame timing differs from requested range; output retained for inspection") }
        }
    }
}
do { try run() } catch {
    FileHandle.standardError.write(Data("ERROR: \(error)\n".utf8))
    exit(1)
}
