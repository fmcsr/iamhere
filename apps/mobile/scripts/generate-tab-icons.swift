// Mesajlar sekmesinin "yeni bir şey var" simgesi (TASARIM.md §5.6): sekmenin kendi SF Symbol'ü, sağ alt
// köşesinde küçücük bir nokta (Instagram'daki gibi). iOS'un sekme rozeti simgenin sağ üstüne çıkıp yandaki
// seçili sekmenin camına taşıyordu; nokta simgenin kendi çerçevesinde kalır.
//
// Simge şablon (template) olarak kullanılır: sekme çubuğu onu da öteki simgeler gibi boyar, cam açığa ya da
// koyuya döndüğünde nokta da simgeyle birlikte döner. Simgeyi iOS'un kendisi çizer (macOS bu simgeyi farklı
// çiziyor); boyu sekme çubuğundakiyle aynı (iOS 27 ekran görüntüsünden ölçüldü: 23 pt, regular).
//
// Kullanım (apps/mobile içinden; açık bir iOS simülatörü gerekir):
//   xcrun -sdk iphonesimulator swiftc -target arm64-apple-ios27.0-simulator scripts/generate-tab-icons.swift -o /tmp/tab-icons
//   xcrun simctl spawn booted /tmp/tab-icons "$PWD/assets/images/tabIcons"
import UIKit

let configuration = UIImage.SymbolConfiguration(pointSize: 23, weight: .regular, scale: .medium)
/// Nokta çapı, çevresindeki boşluk ve simgenin sağ alt köşesinden dışarı taşması (pt).
let dot: CGFloat = 5.5
let gap: CGFloat = 1.25
let overhang = CGPoint(x: 2.5, y: 0.5)

let icons = [
  ("bubble.left.and.bubble.right", "messages-dot"),
  ("bubble.left.and.bubble.right.fill", "messages-dot-fill"),
]
let outDir = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)

/// Simgenin görünen kısmının sağ ve alt kenarı (pt).
func glyphBottomRight(_ image: UIImage) -> CGPoint {
  let cg = image.cgImage!
  let width = cg.width, height = cg.height
  var alpha = [UInt8](repeating: 0, count: width * height)
  let context = CGContext(data: &alpha, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width, space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.alphaOnly.rawValue)!
  context.draw(cg, in: CGRect(x: 0, y: 0, width: width, height: height))
  var right = 0, bottom = 0
  for y in 0..<height {
    for x in 0..<width where alpha[y * width + x] > 128 {
      right = max(right, x)
      bottom = max(bottom, y)
    }
  }
  return CGPoint(x: CGFloat(right + 1) / image.scale, y: CGFloat(bottom + 1) / image.scale)
}

func render(_ symbol: UIImage, scale: CGFloat, dotAt corner: CGPoint?) -> UIImage {
  let format = UIGraphicsImageRendererFormat()
  format.scale = scale
  return UIGraphicsImageRenderer(size: symbol.size, format: format).image { context in
    symbol.withTintColor(.black, renderingMode: .alwaysOriginal).draw(at: .zero)
    guard let corner else { return }
    let center = CGPoint(x: corner.x - dot / 2 + overhang.x, y: corner.y - dot / 2 + overhang.y)
    let knockout = dot / 2 + gap
    let cg = context.cgContext
    cg.setBlendMode(.clear)
    cg.fillEllipse(in: CGRect(x: center.x - knockout, y: center.y - knockout, width: knockout * 2, height: knockout * 2))
    cg.setBlendMode(.normal)
    cg.setFillColor(UIColor.black.cgColor)
    cg.fillEllipse(in: CGRect(x: center.x - dot / 2, y: center.y - dot / 2, width: dot, height: dot))
  }
}

for (name, file) in icons {
  guard let symbol = UIImage(systemName: name, withConfiguration: configuration) else { fatalError("SF Symbol bulunamadı: \(name)") }
  // Nokta her ölçekte aynı yere (pt) konur; yeri @3x çizimden ölçülür.
  let corner = glyphBottomRight(render(symbol, scale: 3, dotAt: nil))
  for scale in [1, 2, 3] as [CGFloat] {
    let suffix = scale == 1 ? "" : "@\(Int(scale))x"
    let url = outDir.appendingPathComponent("\(file)\(suffix).png")
    try! render(symbol, scale: scale, dotAt: corner).pngData()!.write(to: url)
    print("\(url.lastPathComponent)  \(symbol.size.width * scale)x\(symbol.size.height * scale)")
  }
}
