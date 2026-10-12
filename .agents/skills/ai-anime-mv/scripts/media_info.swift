import AVFoundation
let a = AVURLAsset(url: URL(fileURLWithPath: CommandLine.arguments[1]))
print("duration", CMTimeGetSeconds(a.duration))
for t in a.tracks { for f in t.formatDescriptions as! [CMFormatDescription] { let s = CMFormatDescriptionGetMediaSubType(f); print(t.mediaType.rawValue, String(format:"%c%c%c%c", (s>>24)&255,(s>>16)&255,(s>>8)&255,s&255), t.estimatedDataRate) } }
