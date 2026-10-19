// Mesajlar sekmesinin "yeni bir şey var" simgesi (TASARIM.md §5.6, T-27): sekmenin kendi SF Symbol'ü, sağ alt
// köşesinde küçücük kırmızı nokta (Instagram'daki gibi). iOS'un sekme rozeti simgenin sağ üstüne çıkıp yandaki
// seçili sekmenin camına taşıyordu; nokta simgenin kendi çerçevesinde kalır.
//
// Nokta kırmızı kalsın diye simge "original" çizilir: açık modda siyah, koyu modda beyaz (sekme çubuğunun seçili
// olmayan simgeleriyle aynı); asset kataloğu açık/koyu çeşidi kendisi seçer. Seçiliyken simge şablondur: iOS onu
// öteki seçili simgeler gibi fuşyaya boyar (nokta da fuşya olur). Simgeyi iOS'un kendisi çizer (macOS bu simgeyi
// farklı çiziyor); boyu sekme çubuğundakiyle aynı (iOS 27 ekran görüntüsünden ölçüldü: 23 pt, regular).
// Çıktı assets/xcassets/ altındaki iki imageset; plugins/with-xcassets.js bunları derlemede asset kataloğuna kopyalar.
//
// Kullanım (apps/mobile içinden; açık bir iOS simülatörü gerekir):
//   xcrun -sdk iphonesimulator swiftc -target arm64-apple-ios27.0-simulator scripts/generate-tab-icons.swift -o /tmp/tab-icons
//   xcrun simctl spawn booted /tmp/tab-icons "$PWD/assets/xcassets"
import UIKit

let configuration = UIImage.SymbolConfiguration(pointSize: 23, weight: .regular, scale: .medium)
/// Nokta çapı, çevresindeki boşluk ve simgenin sağ alt köşesinden dışarı taşması (pt).
let dot: CGFloat = 5.5
let gap: CGFloat = 1.25
let overhang = CGPoint(x: 2.5, y: 0.5)

/// iOS'un sistem kırmızısı (açık / koyu).
let red = (light: UIColor(red: 1, green: 59 / 255, blue: 48 / 255, alpha: 1), dark: UIColor(red: 1, green: 69 / 255, blue: 58 / 255, alpha: 1))

struct Variant {
  let file: String
  let glyph: UIColor
  let dot: UIColor
  let dark: Bool
}

struct ImageSet {
  let name: String
  let symbol: String
  /// "original": renkler korunur · "template": iOS sekme rengine boyar.
  let rendering: String
  let variants: [Variant]
}

let sets = [
  ImageSet(name: "tab-messages-dot", symbol: "bubble.left.and.bubble.right", rendering: "original", variants: [
    Variant(file: "messages-dot", glyph: .black, dot: red.light, dark: false),
    Variant(file: "messages-dot-dark", glyph: .white, dot: red.dark, dark: true),
  ]),
  ImageSet(name: "tab-messages-dot-selected", symbol: "bubble.left.and.bubble.right.fill", rendering: "template", variants: [
    Variant(file: "messages-dot-selected", glyph: .black, dot: .black, dark: false),
  ]),
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

func render(_ symbol: UIImage, scale: CGFloat, glyph: UIColor, dotColor: UIColor?, at corner: CGPoint) -> UIImage {
  let format = UIGraphicsImageRendererFormat()
  format.scale = scale
  return UIGraphicsImageRenderer(size: symbol.size, format: format).image { context in
    symbol.withTintColor(glyph, renderingMode: .alwaysOriginal).draw(at: .zero)
    guard let dotColor else { return }
    let center = CGPoint(x: corner.x - dot / 2 + overhang.x, y: corner.y - dot / 2 + overhang.y)
    let knockout = dot / 2 + gap
    let cg = context.cgContext
    cg.setBlendMode(.clear)
    cg.fillEllipse(in: CGRect(x: center.x - knockout, y: center.y - knockout, width: knockout * 2, height: knockout * 2))
    cg.setBlendMode(.normal)
    cg.setFillColor(dotColor.cgColor)
    cg.fillEllipse(in: CGRect(x: center.x - dot / 2, y: center.y - dot / 2, width: dot, height: dot))
  }
}

for set in sets {
  guard let symbol = UIImage(systemName: set.symbol, withConfiguration: configuration) else { fatalError("SF Symbol bulunamadı: \(set.symbol)") }
  // Nokta her ölçekte aynı yere (pt) konur; yeri @3x çizimden ölçülür.
  let corner = glyphBottomRight(render(symbol, scale: 3, glyph: .black, dotColor: nil, at: .zero))
  let dir = outDir.appendingPathComponent("\(set.name).imageset", isDirectory: true)
  try! FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
  var images: [[String: Any]] = []
  for variant in set.variants {
    for scale in [2, 3] {
      let file = "\(variant.file)@\(scale)x.png"
      try! render(symbol, scale: CGFloat(scale), glyph: variant.glyph, dotColor: variant.dot, at: corner).pngData()!.write(to: dir.appendingPathComponent(file))
      var entry: [String: Any] = ["filename": file, "idiom": "universal", "scale": "\(scale)x"]
      if variant.dark { entry["appearances"] = [["appearance": "luminosity", "value": "dark"]] }
      images.append(entry)
      print("\(set.name)/\(file)")
    }
  }
  let contents: [String: Any] = [
    "images": images,
    "info": ["author": "xcode", "version": 1],
    "properties": ["template-rendering-intent": set.rendering],
  ]
  let json = try! JSONSerialization.data(withJSONObject: contents, options: [.prettyPrinted, .sortedKeys])
  try! json.write(to: dir.appendingPathComponent("Contents.json"))
}
