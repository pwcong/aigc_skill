import Vision
import CoreImage
import AppKit
// Usage: cutout <in> <outdir> <prefix>
let inURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outDir = CommandLine.arguments[2], prefix = CommandLine.arguments[3]
let ci = CIImage(contentsOf: inURL)!
let req = VNGenerateForegroundInstanceMaskRequest()
let h = VNImageRequestHandler(ciImage: ci)
try! h.perform([req])
guard let res = req.results?.first else { print("no subject"); exit(1) }
print("instances:", res.allInstances.count)
let ctx = CIContext()
for (i, inst) in res.allInstances.sorted().enumerated() {
  let buf = try! res.generateMaskedImage(ofInstances: IndexSet(integer: inst), from: h, croppedToInstancesExtent: true)
  let img = CIImage(cvPixelBuffer: buf)
  let url = URL(fileURLWithPath: "\(outDir)/\(prefix)_\(i).png")
  try! ctx.writePNGRepresentation(of: img, to: url, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
  print(url.lastPathComponent, img.extent)
}
