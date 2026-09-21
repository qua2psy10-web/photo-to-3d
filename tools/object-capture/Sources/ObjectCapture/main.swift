import Foundation
import Metal
import ModelIO
import RealityKit

struct CLIError: Error, LocalizedError, CustomStringConvertible {
    let description: String
    init(_ description: String) { self.description = description }
    var errorDescription: String? { description }
}

struct Args {
    var inputDir: URL
    var usdzURL: URL
    var objURL: URL?
    var detail: PhotogrammetrySession.Request.Detail
}

func parseArgs(_ argv: [String]) throws -> Args {
    var input: String?
    var output: String?
    var obj: String?
    var detailRaw = "medium"

    var i = 1
    while i < argv.count {
        let a = argv[i]
        let next = i + 1 < argv.count ? argv[i + 1] : nil
        switch a {
        case "--input":
            input = next; i += 2
        case "--output":
            output = next; i += 2
        case "--obj":
            obj = next; i += 2
        case "--detail":
            detailRaw = next ?? "medium"; i += 2
        default:
            throw CLIError("Unknown argument: \(a)")
        }
    }

    guard let input, let output else {
        throw CLIError("Usage: object-capture --input DIR --output model.usdz [--obj model.obj] [--detail preview|reduced|medium|full|raw]")
    }

    let detail: PhotogrammetrySession.Request.Detail
    switch detailRaw.lowercased() {
    case "preview": detail = .preview
    case "reduced": detail = .reduced
    case "medium": detail = .medium
    case "full": detail = .full
    case "raw": detail = .raw
    default:
        throw CLIError("Invalid --detail \(detailRaw)")
    }

    return Args(
        inputDir: URL(fileURLWithPath: input, isDirectory: true),
        usdzURL: URL(fileURLWithPath: output),
        objURL: obj.map { URL(fileURLWithPath: $0) },
        detail: detail
    )
}

func emit(_ obj: [String: Any]) {
    guard JSONSerialization.isValidJSONObject(obj),
          let data = try? JSONSerialization.data(withJSONObject: obj),
          let line = String(data: data, encoding: .utf8)
    else { return }
    print(line)
    fflush(stdout)
}

func exportObj(from usdz: URL, to obj: URL) throws {
    let asset = MDLAsset(url: usdz)
    try FileManager.default.createDirectory(
        at: obj.deletingLastPathComponent(),
        withIntermediateDirectories: true
    )
    if asset.count == 0 {
        throw CLIError("USDZ contained no mesh to export")
    }
    try asset.export(to: obj)
}

@main
struct ObjectCaptureCLI {
    static func main() async {
        do {
            try await run()
        } catch {
            emit(["event": "error", "message": error.localizedDescription])
            fputs("error: \(error.localizedDescription)\n", stderr)
            exit(1)
        }
    }

    static func run() async throws {
        let args = try parseArgs(CommandLine.arguments)

        guard PhotogrammetrySession.isSupported else {
            throw CLIError("Object Capture is not supported on this Mac (needs Apple Silicon or AMD GPU).")
        }
        guard let _ = MTLCreateSystemDefaultDevice() else {
            throw CLIError("No Metal GPU device available.")
        }

        var isDir: ObjCBool = false
        guard FileManager.default.fileExists(atPath: args.inputDir.path, isDirectory: &isDir), isDir.boolValue else {
            throw CLIError("Input folder not found: \(args.inputDir.path)")
        }

        try FileManager.default.createDirectory(
            at: args.usdzURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )

        var config = PhotogrammetrySession.Configuration()
        config.sampleOrdering = .unordered
        config.featureSensitivity = .normal

        let session = try PhotogrammetrySession(
            input: args.inputDir,
            configuration: config
        )
        let request = PhotogrammetrySession.Request.modelFile(
            url: args.usdzURL,
            detail: args.detail
        )

        emit(["event": "start", "input": args.inputDir.path])
        try session.process(requests: [request])

        for try await output in session.outputs {
            switch output {
            case .inputComplete:
                emit(["event": "inputComplete"])
            case .requestProgress(_, let fraction):
                emit(["event": "progress", "fraction": fraction])
            case .requestComplete(_, let result):
                if case let .modelFile(url) = result {
                    emit(["event": "model", "path": url.path])
                } else {
                    emit(["event": "requestComplete"])
                }
            case .requestError(_, let error):
                throw CLIError(error.localizedDescription)
            case .processingComplete:
                emit(["event": "processingComplete"])
            case .processingCancelled:
                throw CLIError("Photogrammetry was cancelled.")
            case .invalidSample(let id, let reason):
                emit(["event": "invalidSample", "id": id, "reason": String(describing: reason)])
            case .skippedSample(let id):
                emit(["event": "skippedSample", "id": id])
            case .automaticDownsampling:
                emit(["event": "automaticDownsampling"])
            case .requestProgressInfo(_, let info):
                emit(["event": "progressInfo", "info": String(describing: info)])
            case .stitchingIncomplete:
                emit(["event": "stitchingIncomplete"])
            @unknown default:
                emit(["event": "unknown"])
            }
        }

        guard FileManager.default.fileExists(atPath: args.usdzURL.path) else {
            throw CLIError("Photogrammetry finished without writing a USDZ.")
        }

        if let objURL = args.objURL {
            try exportObj(from: args.usdzURL, to: objURL)
            emit(["event": "obj", "path": objURL.path])
        }

        emit(["event": "done", "usdz": args.usdzURL.path])
    }
}
