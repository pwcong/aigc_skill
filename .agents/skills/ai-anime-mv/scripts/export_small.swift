import AVFoundation
// Usage: export_small <in.mp4> <out.mp4> [height=720] [video_kbps=2500] [audio_kbps=192]
// Downscaled H.264 + AAC via AVAssetReader/Writer (no ffmpeg). e.g. 360 700 96 -> ~20MB for 3.5 min
let args = CommandLine.arguments
let src = URL(fileURLWithPath: args[1]), dst = URL(fileURLWithPath: args[2])
let height = args.count > 3 ? Int(args[3])! : 720
let kbps = args.count > 4 ? Int(args[4])! : 2500
let akbps = args.count > 5 ? Int(args[5])! : 192
let width = (height * 16 / 9) / 2 * 2
try? FileManager.default.removeItem(at: dst)
let asset = AVURLAsset(url: src)
let reader = try! AVAssetReader(asset: asset)
let writer = try! AVAssetWriter(outputURL: dst, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true

let vt = asset.tracks(withMediaType: .video)[0]
let vOut = AVAssetReaderTrackOutput(track: vt, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange])
reader.add(vOut)
let vIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: width, AVVideoHeightKey: height,
  AVVideoScalingModeKey: AVVideoScalingModeResizeAspect,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: kbps * 1000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel],
])
vIn.expectsMediaDataInRealTime = false
writer.add(vIn)

var aOut: AVAssetReaderTrackOutput? = nil, aIn: AVAssetWriterInput? = nil
if let at = asset.tracks(withMediaType: .audio).first {
  aOut = AVAssetReaderTrackOutput(track: at, outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM])
  reader.add(aOut!)
  aIn = AVAssetWriterInput(mediaType: .audio, outputSettings: [AVFormatIDKey: kAudioFormatMPEG4AAC, AVNumberOfChannelsKey: 2, AVSampleRateKey: 48000, AVEncoderBitRateKey: akbps * 1000])
  writer.add(aIn!)
}
reader.startReading(); writer.startWriting(); writer.startSession(atSourceTime: .zero)
let group = DispatchGroup()
func pump(_ input: AVAssetWriterInput, _ output: AVAssetReaderTrackOutput, _ q: String) {
  group.enter()
  input.requestMediaDataWhenReady(on: DispatchQueue(label: q)) {
    while input.isReadyForMoreMediaData {
      if let sb = output.copyNextSampleBuffer() { input.append(sb) } else { input.markAsFinished(); group.leave(); return }
    }
  }
}
pump(vIn, vOut, "v")
if let ai = aIn, let ao = aOut { pump(ai, ao, "a") }
group.wait()
let sem = DispatchSemaphore(value: 0)
writer.finishWriting { sem.signal() }
sem.wait()
print(writer.status == .completed ? "ok \(dst.path)" : "failed: \(String(describing: writer.error))")
