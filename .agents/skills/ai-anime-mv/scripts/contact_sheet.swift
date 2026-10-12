import AppKit
// grid <out.jpg> <cols> files...
let out = CommandLine.arguments[1]; let cols = Int(CommandLine.arguments[2])!
let files = Array(CommandLine.arguments.dropFirst(3))
let tw: CGFloat = 640, th: CGFloat = 360, lh: CGFloat = 28
let rows = (files.count + cols - 1) / cols
let W = CGFloat(cols) * tw, H = CGFloat(rows) * (th + lh)
let img = NSImage(size: NSSize(width: W, height: H))
img.lockFocus()
NSColor(white: 0.1, alpha: 1).setFill(); NSRect(x: 0, y: 0, width: W, height: H).fill()
for (i, f) in files.enumerated() {
  let r = i / cols, c = i % cols
  let x = CGFloat(c) * tw, y = H - CGFloat(r + 1) * (th + lh)
  NSImage(contentsOfFile: f)?.draw(in: NSRect(x: x, y: y + lh, width: tw, height: th))
  let name = (f as NSString).lastPathComponent.replacingOccurrences(of: "frame_", with: "").replacingOccurrences(of: ".jpg", with: "s")
  (name as NSString).draw(at: NSPoint(x: x + 8, y: y + 5), withAttributes: [.font: NSFont.systemFont(ofSize: 18), .foregroundColor: NSColor.white])
}
img.unlockFocus()
let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.8])!.write(to: URL(fileURLWithPath: out))
