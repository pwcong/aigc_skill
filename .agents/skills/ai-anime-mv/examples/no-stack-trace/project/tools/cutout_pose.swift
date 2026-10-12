import Vision
import CoreImage
// Usage: cutall <in> <out.png>  — merges all foreground instances into one cutout
let ci = CIImage(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))!
let req = VNGenerateForegroundInstanceMaskRequest()
let h = VNImageRequestHandler(ciImage: ci)
try! h.perform([req])
guard let res = req.results?.first else { print("no subject"); exit(1) }
let buf = try! res.generateMaskedImage(ofInstances: res.allInstances, from: h, croppedToInstancesExtent: true)
let img = CIImage(cvPixelBuffer: buf)
try! CIContext().writePNGRepresentation(of: img, to: URL(fileURLWithPath: CommandLine.arguments[2]), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print(CommandLine.arguments[2].split(separator: "/").last!, res.allInstances.count, Int(img.extent.width), Int(img.extent.height))
