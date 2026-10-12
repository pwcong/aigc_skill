import Vision
import CoreImage
// Usage: face_boxes <img>... — prints JSON {file: {face:[x,y,w,h], mouth:[...], eyes:[...]}} in pixel coords (top-left origin)
var out: [String: Any] = [:]
for path in CommandLine.arguments.dropFirst() {
  let ci = CIImage(contentsOf: URL(fileURLWithPath: path))!
  let W = ci.extent.width, H = ci.extent.height
  let req = VNDetectFaceLandmarksRequest()
  try? VNImageRequestHandler(ciImage: ci).perform([req])
  guard let face = req.results?.max(by: { $0.boundingBox.width < $1.boundingBox.width }) else { out[path] = NSNull(); continue }
  let bb = face.boundingBox
  func px(_ r: CGRect) -> [Int] { [Int(r.minX * W), Int((1 - r.maxY) * H), Int(r.width * W), Int(r.height * H)] }
  var rec: [String: Any] = ["face": px(bb)]
  func region(_ pts: [CGPoint]?) -> [Int]? {
    guard let p = pts, !p.isEmpty else { return nil }
    let xs = p.map { bb.minX + $0.x * bb.width }, ys = p.map { bb.minY + $0.y * bb.height }
    return px(CGRect(x: xs.min()!, y: ys.min()!, width: xs.max()! - xs.min()!, height: ys.max()! - ys.min()!))
  }
  if let lm = face.landmarks {
    rec["mouth"] = region(lm.outerLips?.normalizedPoints)
    let eyes = (lm.leftEye?.normalizedPoints ?? []) + (lm.rightEye?.normalizedPoints ?? [])
    rec["eyes"] = region(eyes)
  }
  out[(path as NSString).lastPathComponent] = rec
}
let data = try! JSONSerialization.data(withJSONObject: out, options: [.prettyPrinted, .sortedKeys])
print(String(data: data, encoding: .utf8)!)
