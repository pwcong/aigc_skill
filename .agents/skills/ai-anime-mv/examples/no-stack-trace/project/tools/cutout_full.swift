import Vision
import CoreImage
// Usage: cutout_full <in> <out.png> — foreground cutout kept at full frame size (for 2.5D layering)
let ci = CIImage(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))!
let req = VNGenerateForegroundInstanceMaskRequest()
let h = VNImageRequestHandler(ciImage: ci)
try! h.perform([req])
guard let res = req.results?.first else { print("no subject"); exit(1) }
let buf = try! res.generateMaskedImage(ofInstances: res.allInstances, from: h, croppedToInstancesExtent: false)
try! CIContext().writePNGRepresentation(of: CIImage(cvPixelBuffer: buf), to: URL(fileURLWithPath: CommandLine.arguments[2]), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("cut", CommandLine.arguments[2].split(separator: "/").suffix(2).joined(separator: "/"))
