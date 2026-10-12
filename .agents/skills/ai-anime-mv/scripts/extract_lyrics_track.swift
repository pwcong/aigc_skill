import AVFoundation
let a = AVURLAsset(url: URL(fileURLWithPath: CommandLine.arguments[1]))
let t = a.tracks(withMediaType: .text).first ?? a.tracks.first { $0.mediaType.rawValue == "sbtl" }!
let r = try! AVAssetReader(asset: a)
let o = AVAssetReaderTrackOutput(track: t, outputSettings: nil)
r.add(o); r.startReading()
while let sb = o.copyNextSampleBuffer() {
  let pts = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sb))
  let dur = CMTimeGetSeconds(CMSampleBufferGetDuration(sb))
  guard let bb = CMSampleBufferGetDataBuffer(sb) else { continue }
  var len = 0; var ptr: UnsafeMutablePointer<Int8>? = nil
  CMBlockBufferGetDataPointer(bb, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &len, dataPointerOut: &ptr)
  let d = Data(bytes: ptr!, count: len)
  if d.count < 2 { continue }
  let n = Int(d[0]) << 8 | Int(d[1])
  let s = String(data: d.subdata(in: 2..<min(2+n, d.count)), encoding: .utf8) ?? ""
  if s.isEmpty { continue }
  print(String(format: "%.3f\t%.3f\t", pts, pts+dur) + s.replacingOccurrences(of: "\n", with: " / "))
}
