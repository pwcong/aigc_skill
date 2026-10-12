import AVFoundation
let a = AVURLAsset(url: URL(fileURLWithPath: CommandLine.arguments[1]))
let t = a.tracks(withMediaType: .audio)[0]
let r = try! AVAssetReader(asset: a)
let settings: [String: Any] = [AVFormatIDKey: kAudioFormatLinearPCM, AVLinearPCMBitDepthKey: 16, AVLinearPCMIsFloatKey: false, AVLinearPCMIsBigEndianKey: false, AVSampleRateKey: 48000, AVNumberOfChannelsKey: 2]
let o = AVAssetReaderTrackOutput(track: t, outputSettings: settings)
r.add(o); r.startReading()
var pcm = Data()
while let sb = o.copyNextSampleBuffer() {
  guard let bb = CMSampleBufferGetDataBuffer(sb) else { continue }
  let len = CMBlockBufferGetDataLength(bb); var d = Data(count: len)
  d.withUnsafeMutableBytes { _ = CMBlockBufferCopyDataBytes(bb, atOffset: 0, dataLength: len, destination: $0.baseAddress!) }
  pcm.append(d)
}
var h = Data()
func u32(_ v: UInt32) { var x = v.littleEndian; h.append(Data(bytes: &x, count: 4)) }
func u16(_ v: UInt16) { var x = v.littleEndian; h.append(Data(bytes: &x, count: 2)) }
h.append("RIFF".data(using: .ascii)!); u32(UInt32(36 + pcm.count)); h.append("WAVEfmt ".data(using: .ascii)!)
u32(16); u16(1); u16(2); u32(48000); u32(48000*4); u16(4); u16(16)
h.append("data".data(using: .ascii)!); u32(UInt32(pcm.count))
try! (h + pcm).write(to: URL(fileURLWithPath: CommandLine.arguments[2]))
print("wrote", pcm.count/4, "frames", Double(pcm.count/4)/48000, "s")
