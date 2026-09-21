// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "object-capture",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "object-capture", targets: ["ObjectCapture"]),
    ],
    targets: [
        .executableTarget(
            name: "ObjectCapture"
        ),
    ]
)
